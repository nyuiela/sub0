import { BottomNavSkeleton } from '@/components/layout/BottomNav/BottomNavSkeleton'
import { DraggableColumnsSkeleton } from '@/components/layout/DraggableColumns/DraggableColumnsSkeleton'
import { FilterBarSkeleton } from '@/components/layout/FilterBar/FilterBarSkeleton'
import { TopNavSkeleton } from '@/components/layout/TopNav/TopNavSkeleton'
import React from 'react'

export default function Loading() {
  return (
    <>
      <TopNavSkeleton />
      <FilterBarSkeleton />
      <main className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <DraggableColumnsSkeleton />
      </main>
      <BottomNavSkeleton />
    </>
  )
}
