# Setting Up PocketBase for BlendSphere

This guide provides detailed instructions for setting up and running PocketBase as the backend for BlendSphere.

## Prerequisites

- Linux or macOS environment (Windows users should use WSL)
- Bash shell
- wget or curl for downloading files

## Installation

We provide scripts to make installation easy:

1. Navigate to the PocketBase directory:
   ```bash
   cd /home/wlas/BlendSphere/pocketbase
   ```

2. Run the installation script:
   ```bash
   ./install_pocketbase.sh
   ```

   This script:
   - Downloads PocketBase v0.28.2
   - Extracts it to the current directory
   - Makes the binary executable
   - Cleans up temporary files

## Running PocketBase

After installation, you can start PocketBase with:

```bash
./run_pocketbase.sh
```

This script:
- Starts the PocketBase server on http://127.0.0.1:8090
- Automatically applies migrations from the migrations directory

## Creating a Superuser Account

When you first run PocketBase:

1. Click the link provided in the console
2. You'll be presented with a setup screen to create your first admin account
3. Enter your email address
4. Create a strong password and confirm it
5. Click "Create account"

This superuser account will have full administrative access to PocketBase, allowing you to:
- Manage collections and records
- Configure authentication settings
- View and manage users
- Run migrations manually if needed

## Using the Admin UI

After creating your superuser account, access the dashboard at http://127.0.0.1:8090/_/

You can use the Admin UI to:

1. Browse and manage records in all collections
2. Create new collections or modify existing ones
3. Manage users and their permissions
4. Configure authentication providers
5. View API logs and system health

## Interacting with PocketBase Programmatically

For frontend development, BlendSphere already includes service modules for interacting with PocketBase:

- See `src/lib/pocketbase.ts` for the PocketBase client setup
- Service modules in `src/lib/services/` provide easy-to-use functions for common operations

## Setting Up for Development

For local development:

1. Start PocketBase using `./run_pocketbase.sh`
2. In a separate terminal, start the frontend development server
3. The frontend will automatically connect to the PocketBase instance

## Setting Up for Production

For production deployment:

1. Ensure the production server has PocketBase installed
2. Configure environment variables to point to your production PocketBase URL
3. Set up proper security measures (HTTPS, firewall rules, etc.)
4. Consider setting up a reverse proxy for better security and performance

## Troubleshooting

If you encounter issues:

1. Check PocketBase logs for error messages
2. Verify that PocketBase is running on the expected port
3. Ensure that the frontend is correctly configured to use the PocketBase URL
4. Check that migrations have been applied correctly

For more help, refer to the [PocketBase documentation](https://pocketbase.io/docs/).
