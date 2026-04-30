<?php

namespace App\Models;

/**
 * Category Model
 */
class Category extends Model
{
    protected $table = 'categories';
    protected $primaryKey = 'id';

    /**
     * Get all active categories
     */
    public function getActive(): array
    {
        return $this->all(['is_active' => true], 'name ASC');
    }

    /**
     * Find category by name
     */
    public function findByName(string $name): ?array
    {
        return $this->findOneBy('name', $name);
    }
}
