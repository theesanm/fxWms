const { Service } = require('node-windows');
const path = require('path');
const exec = require('child_process').exec;

const svc = new Service({
    name: 'AdminPortal',
    script: path.join(__dirname, 'server.js')
});

// Force remove service using sc delete if still exists after uninstall
function forceRemoveService() {
    return new Promise((resolve, reject) => {
        exec('sc delete AdminPortal', (error, stdout, stderr) => {
            if (error) {
                console.log('Warning: SC delete returned error:', error.message);
                // Don't reject as the service might not exist
            }
            resolve();
        });
    });
}

// Check if service exists
function checkService() {
    return new Promise((resolve, reject) => {
        exec('sc query AdminPortal', (error, stdout, stderr) => {
            resolve(!error); // Returns true if service exists
        });
    });
}

async function cleanupService() {
    console.log('Starting service cleanup...');
    
    try {
        // First try normal uninstall
        await new Promise((resolve) => {
            svc.on('uninstall', () => {
                console.log('Service uninstalled via node-windows');
                resolve();
            });

            svc.on('error', (error) => {
                console.log('Service uninstall error:', error);
                resolve(); // Continue despite error
            });

            svc.uninstall();
        });

        // Wait a bit for uninstall to complete
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check if service still exists
        const serviceExists = await checkService();
        if (serviceExists) {
            console.log('Service still exists, forcing removal...');
            await forceRemoveService();
        }

        // Final cleanup of daemon files
        const daemonDir = path.join(process.env.PROGRAMDATA, 'AdminPortal');
        const { rm } = require('fs/promises');
        try {
            await rm(daemonDir, { recursive: true, force: true });
            console.log('Daemon directory removed:', daemonDir);
        } catch (err) {
            console.log('Note: No daemon directory found or unable to remove');
        }

        console.log('Service cleanup completed successfully');
    } catch (error) {
        console.error('Cleanup error:', error);
        process.exit(1);
    }
}

cleanupService();
