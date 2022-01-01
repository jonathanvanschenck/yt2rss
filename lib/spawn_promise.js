const { spawn } = require("child_process");

function spawn_promise(
    command, 
    args=[],
    {
        stdout = () => {},
        stderr = () => {},
        timeout = null,
    }={}
) {
    return new Promise((resolve, reject) => {
        if ( timeout ) setTimeout(() => reject("timeout"), timeout);
        let _stdout = [];
        let _stderr = [];
        
        const proc = spawn(command, args);

        proc.stdout.on('data', (data) => {
            stdout(data.toString());
            _stdout.push(data.toString());
        });

        proc.stderr.on('data', (data) => {
            stderr(data.toString());
            _stderr.push(data.toString());
        });

        proc.on('error', reject);

        proc.on('exit', (code) => {
            resolve({
                code : code,
                stdout : _stdout.join(""),
                stderr : _stderr.join(""),
            });
        });
    });
}

module.exports = exports = spawn_promise;
