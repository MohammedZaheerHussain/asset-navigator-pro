<?php

namespace App\Models;

class DepreciationConfig extends Model
{
    protected $table = 'depreciation_config';

    public function getAll(): array
    {
        $sql = "SELECT dc.*, c.name as category_name
                FROM {$this->table} dc
                JOIN categories c ON dc.category_id = c.id
                ORDER BY c.name";
        return $this->db->fetchAll($sql);
    }

    public function getByCategory(int $categoryId): ?array
    {
        $sql = "SELECT dc.*, c.name as category_name
                FROM {$this->table} dc
                JOIN categories c ON dc.category_id = c.id
                WHERE dc.category_id = ?";
        return $this->db->fetch($sql, [$categoryId]);
    }

    public function upsert(array $data): array
    {
        $sql = "INSERT INTO {$this->table} 
                    (category_id, method, useful_life_years, residual_percent, annual_rate, service_cost_threshold_percent)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (category_id) DO UPDATE SET
                    method = EXCLUDED.method,
                    useful_life_years = EXCLUDED.useful_life_years,
                    residual_percent = EXCLUDED.residual_percent,
                    annual_rate = EXCLUDED.annual_rate,
                    service_cost_threshold_percent = EXCLUDED.service_cost_threshold_percent,
                    updated_at = NOW()
                RETURNING *";

        return $this->db->fetch($sql, [
            $data['category_id'],
            $data['method'] ?? 'SLM',
            $data['useful_life_years'] ?? 10,
            $data['residual_percent'] ?? 5.00,
            $data['annual_rate'] ?? null,
            $data['service_cost_threshold_percent'] ?? 50.00,
        ]);
    }

    /**
     * Calculate depreciation for an asset
     */
    public function calculateDepreciation(array $asset, ?array $config = null): array
    {
        if (!$config) {
            $config = $this->getByCategory($asset['category_id']);
        }

        $purchaseCost = (float)($asset['purchase_cost'] ?? 0);
        $purchaseDate = $asset['purchase_date'] ?? null;

        if (!$purchaseCost || !$purchaseDate || !$config) {
            return [
                'purchase_cost' => $purchaseCost,
                'current_book_value' => $purchaseCost,
                'accumulated_depreciation' => 0,
                'annual_depreciation' => 0,
                'years_used' => 0,
                'useful_life_years' => $config['useful_life_years'] ?? 10,
                'method' => $config['method'] ?? 'SLM',
                'residual_value' => $purchaseCost * (($config['residual_percent'] ?? 5) / 100),
            ];
        }

        $method = $config['method'] ?? 'SLM';
        $usefulLife = (int)($config['useful_life_years'] ?? 10);
        $residualPercent = (float)($config['residual_percent'] ?? 5.00);
        $residualValue = $purchaseCost * ($residualPercent / 100);
        $depreciableAmount = $purchaseCost - $residualValue;

        // Calculate years used
        $start = new \DateTime($purchaseDate);
        $now = new \DateTime();
        $diff = $start->diff($now);
        $yearsUsed = $diff->y + ($diff->m / 12);

        $schedule = [];
        $accumulatedDep = 0;
        $currentBookValue = $purchaseCost;

        if ($method === 'SLM') {
            $annualDep = $depreciableAmount / $usefulLife;

            for ($y = 1; $y <= min(ceil($yearsUsed), $usefulLife); $y++) {
                $fraction = ($y == ceil($yearsUsed) && fmod($yearsUsed, 1) > 0) 
                    ? fmod($yearsUsed, 1) : 1;
                $dep = $annualDep * $fraction;
                $accumulatedDep += $dep;
                $currentBookValue = max($purchaseCost - $accumulatedDep, $residualValue);
                $schedule[] = [
                    'year' => $y,
                    'opening_value' => round($purchaseCost - $accumulatedDep + $dep, 2),
                    'depreciation' => round($dep, 2),
                    'closing_value' => round($currentBookValue, 2),
                ];
            }
        } else {
            // WDV
            $rate = (float)($config['annual_rate'] ?? 15.00);
            $bookVal = $purchaseCost;

            for ($y = 1; $y <= min(ceil($yearsUsed), $usefulLife); $y++) {
                $fraction = ($y == ceil($yearsUsed) && fmod($yearsUsed, 1) > 0) 
                    ? fmod($yearsUsed, 1) : 1;
                $dep = $bookVal * ($rate / 100) * $fraction;
                $opening = $bookVal;
                $bookVal -= $dep;
                $accumulatedDep += $dep;
                $currentBookValue = max($bookVal, $residualValue);
                $schedule[] = [
                    'year' => $y,
                    'opening_value' => round($opening, 2),
                    'depreciation' => round($dep, 2),
                    'closing_value' => round($currentBookValue, 2),
                ];
            }
        }

        return [
            'purchase_cost' => round($purchaseCost, 2),
            'current_book_value' => round($currentBookValue, 2),
            'accumulated_depreciation' => round($accumulatedDep, 2),
            'annual_depreciation' => round($depreciableAmount / $usefulLife, 2),
            'years_used' => round($yearsUsed, 1),
            'useful_life_years' => $usefulLife,
            'remaining_life_years' => round(max(0, $usefulLife - $yearsUsed), 1),
            'method' => $method,
            'residual_value' => round($residualValue, 2),
            'residual_percent' => $residualPercent,
            'schedule' => $schedule,
        ];
    }
}
