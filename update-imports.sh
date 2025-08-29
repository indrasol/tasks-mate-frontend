#!/bin/bash

# This script updates API_ENDPOINTS import paths to use the new centralized config
# Run this script from the tasks-mate-frontend directory

echo "Updating API_ENDPOINTS import paths..."

# Find all TypeScript and TSX files with the old import paths and replace with the new one

# Handle @/../config format
find ./src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|import { API_ENDPOINTS } from "@/../config";|import { API_ENDPOINTS } from "@/config";|g' {} \;
find ./src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|import { API_ENDPOINTS } from '@/../config';|import { API_ENDPOINTS } from '@/config';|g" {} \;

# Handle relative paths
find ./src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|import { API_ENDPOINTS } from '../../config';|import { API_ENDPOINTS } from '@/config';|g" {} \;
find ./src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|import { API_ENDPOINTS } from '../../../config';|import { API_ENDPOINTS } from '@/config';|g" {} \;
find ./src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|import { API_ENDPOINTS } from '../../../../config';|import { API_ENDPOINTS } from '@/config';|g" {} \;

echo "Import paths updated successfully!"
