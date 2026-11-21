# PowerShell cleanup script for AnnaSathi AI\n$projectRoot = 'C:\Users\pavan\OneDrive\Desktop\Projects\AnnaSathi AI'\n\n# Files and directories to remove\n$paths = @(
    "$projectRoot\temp\find_usages.ps1",
    "$projectRoot\temp\tables_usage.txt",
    "$projectRoot\frontend\src\mocks\dashboard-stats.json",
    "$projectRoot\frontend\src\mocks\demo-credentials.ts",
    "$projectRoot\frontend\src\mocks\donations.json",
    "$projectRoot\frontend\src\mocks\ngos.json",
    "$projectRoot\frontend\src\mocks\notifications.json",
    "$projectRoot\frontend\src\mocks\users.json",
    "$projectRoot\frontend\src\mocks\volunteers.json",
    "$projectRoot\backend\database\migrations\20231120_cleanup_unused_tables.sql",
    "$projectRoot\backend\database\migrations\20261121_restore_active_tables.sql",
    "$projectRoot\backend\database\migrations\001_initial_schema.sql",
    "$projectRoot\backend\database\cleanDatabase.js",
    "$projectRoot\backend\database\migrate.js",
    "$projectRoot\backend\.env",
    "$projectRoot\backend\node_modules",
    "$projectRoot\frontend\node_modules"
)\n\nforeach ($p in $paths) {\n    if (Test-Path $p) {\n        if ((Get-Item $p).PSIsContainer) {\n            Write-Host "Removing directory $p"\n            Remove-Item -Recurse -Force $p\n        } else {\n            Write-Host "Removing file $p"\n            Remove-Item -Force $p\n        }\n    } else {\n        Write-Host "Path not found: $p"\n    }\n}\n\nWrite-Host "Cleanup completed."