import Link from "next/link";

import { PURPOSE_CATEGORIES } from "@/lib/purposeCategories";

export function PurposeCategoryNav() {
  return (
    <nav aria-label="찾아보기 목적" className="w-full px-4">
      <ul className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3 lg:grid-cols-5">
        {PURPOSE_CATEGORIES.map((category) => (
          <li key={category.id}>
            {category.availability === "available" ? (
              <Link
                href={category.href}
                className="flex min-h-36 flex-col rounded-xl border border-blue-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span className="text-sm font-semibold text-gray-900">{category.label}</span>
                <span className="mt-2 text-xs leading-5 text-gray-600">{category.description}</span>
              </Link>
            ) : (
              <div
                aria-label={`${category.label}: 준비 중`}
                className="flex min-h-36 flex-col rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4"
              >
                <span className="w-fit rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600">
                  준비 중
                </span>
                <span className="mt-3 text-sm font-semibold text-gray-500">{category.label}</span>
                <span className="mt-2 text-xs leading-5 text-gray-500">{category.description}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
