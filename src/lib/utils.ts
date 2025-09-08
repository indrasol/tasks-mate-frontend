import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Deduplicates and sorts designation names, ensuring "Organization Owner" is always included
 * @param designations Array of designation names from the API
 * @returns Sorted array of unique designation names
 */
export function processDesignations(designations: string[]): string[] {
  let names = [...designations];
  
  // Ensure "Organization Owner" is always available
  if (!names.includes('Organization Owner')) {
    names = ['Organization Owner', ...names];
  }
  
  // Remove duplicates (case-insensitive) and sort
  const uniqueNames = names.filter((name, index, self) => 
    index === self.findIndex(n => n.toLowerCase() === name.toLowerCase())
  ).sort();
  
  return uniqueNames;
}
