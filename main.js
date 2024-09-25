import {MCP2221} from './mcp2221a_web.js'
let mcp;
let gp_status;

// ****************************************
// I2C Event Listener
// ****************************************
document.getElementById('connect').addEventListener('click', async () => {
    mcp = new MCP2221();
    const init_response = await mcp.init();
    logMessage(init_response.message)
    await mcp.init_state();
    gp_status = await mcp.gpioGetPins();
    console.log(gp_status);
    updateGPIOStates(gp_status);
});

document.getElementById('reset').addEventListener('click', async () => {
    try {
        await mcp.reset()
        mcp = new MCP2221();
        const init_response = await mcp.init();
        logMessage(init_response.message)
        await mcp.init_state();
        gp_status = await mcp.gpioGetPins();
    } catch (error) {
        document.getElementById('status').innerText = `Error: ${error.message}`;
    }
});

document.getElementById('i2c-write').addEventListener('click', async () => {
    const slaveAddress = parseInt(document.getElementById('i2c-slave-address').value, 16);
    const registerAddress = parseInt(document.getElementById('i2c-register-address').value, 16);
    const data = document.getElementById('i2c-data').value.split(',').map(value => parseInt(value, 16));
    // Implement I2C write using WebHID API
    console.log(data);
    logMessage( 'i2c-write', hexString(slaveAddress), hexString(registerAddress), Array.from(data).map(x => hexString(x)).join(', ') )
    const i2cWriteData = await mcp.i2cWrite(slaveAddress, registerAddress, data);
    console.log(i2cWriteData);
    const writeLog = Array.from(i2cWriteData.data).map(x => hexString(x)).join(', ');
    logMessage( 'MCP2221A - WRITE:', hexString(slaveAddress), hexString(registerAddress), `[${writeLog}]`);
    // logMessage(slaveAddress.toString(16).toUpperCase().padStart(4, '0x'))
});

document.getElementById('i2c-read').addEventListener('click', async () => {
    const slaveAddress = parseInt(document.getElementById('i2c-slave-address').value, 16);
    const registerAddress = parseInt(document.getElementById('i2c-register-address').value, 16);
    const length = parseInt(document.getElementById('i2c-length').value);
    // Implement I2C read using WebHID API
    // logMessage( 'i2c-read', hexString(slaveAddress), hexString(registerAddress), hexString(length) );
    const i2cReadData = await mcp.i2cRead(slaveAddress, registerAddress, length);
    if (i2cReadData.success){
        console.log('i2cReadData', i2cReadData.data);
        const readLog = Array.from(i2cReadData.data).map(x => hexString(x)).join(', ');
        logMessage( 'MCP2221A - READ:', hexString(slaveAddress), hexString(registerAddress), `[${readLog}]`);
    } else {
        logMessage('MCP2221A - READ: Failed, reconnect device');
    }
});

document.getElementById('i2c-dump').addEventListener('click', async () => {
    const slaveAddress = parseInt(document.getElementById('i2c-slave-address').value, 16);
    const firstRegisterAddress = parseInt(document.getElementById('i2c-register-address-first').value, 16);
    const lastRegisterAddress = parseInt(document.getElementById('i2c-register-address-last').value, 16);
    // const length = parseInt(document.getElementById('i2c-length').value);
    const length = 1;
    // Implement I2C read using WebHID API
    for(let regAddr = firstRegisterAddress; regAddr <= lastRegisterAddress; regAddr++) {
        // logMessage( 'i2c-read', hexString(slaveAddress), hexString(regAddr), hexString(length) );
        const i2cReadData = await mcp.i2cRead(slaveAddress, regAddr, length);
        if (i2cReadData.success){
            console.log('i2cReadData', i2cReadData.data);
            const readLog = Array.from(i2cReadData.data).map(x => hexString(x)).join(', ');
            logMessage( 'MCP2221A - READ:', hexString(slaveAddress), hexString(regAddr), `${readLog}`);
        } else {
            logMessage('MCP2221A - READ: Failed, reconnect device');

        }

    }
});

document.getElementById('i2c-bit-update').addEventListener('click', async () => {
    const slaveAddress = parseInt(document.getElementById('i2c-slave-address').value, 16);
    const registerAddress = parseInt(document.getElementById('i2c-register-address').value, 16);
    let bitPositions = [];
    let bitValues = [];
    for (let i = 0; i < 8; i++) {
        const bitValue = parseInt(document.getElementById(`bit${i}`).value);

        if ( bitValue === 0 ) {
            bitPositions.push(i);
            bitValues.push(bitValue);
        } else if ( bitValue === 1 ) {
            bitPositions.push(i);
            bitValues.push(bitValue);
        }
    }
    logMessage('bitPositions', bitPositions, 'bitValues', bitValues);
    mcp.i2cUpdateByte(slaveAddress, registerAddress, bitPositions, bitValues)
});

document.getElementById('i2c-find-addr').addEventListener('click', async () => {
    const candidates = [];
    const i2c_addr_found = await mcp.i2cSearchSlaveAddress(candidates);
    // logMessage(i2c_addr_found);
    document.getElementById('i2c-slave-address').value = hexString(i2c_addr_found[0])

});

document.getElementById('clear-log').addEventListener('click', async () => {
    clearlogMessage()
});

document.getElementById('extract-log').addEventListener('click', async () => {
    extractlogMessage()
});

const gpioLength = 4
for (let i = 0; i < gpioLength; i++) {
    document.getElementById(`gpio${i}-on`).addEventListener('click', () =>setGPIO(i, 1));
    document.getElementById(`gpio${i}-off`).addEventListener('click', () =>setGPIO(i, 0));
    document.getElementById(`gpio${i}-toggle`).addEventListener('click', () =>toggleGPIO(i));
}


// ****************************************
// Script Run Event Listener
// ****************************************
// document.getElementById('script-run').addEventListener('click', function(e) {
//     const script = document.getElementById('script').value;
//     logMessage(`sending scripttt - ${script}`)
//     worker.postMessage(script)

// });

// worker.onmessage = function(e) {
//     consoleMessage(e.data);
// }

document.getElementById('script-run').addEventListener('click', function(e) {
    const script = document.getElementById('script').value;
    console.log('eval_script');
    eval_script(script).then(result => {
        console.log(result);
    })

    // consoleMessage(result)

});

async function eval_script(script) {
    const result = await evalAsync(script);
    console.log('result', result);
    return result;

}
async function evalAsync(script) {
    console.log('evalAsync', script);
    const async_script = `(async () => { ${script} })()`
    console.log('async_script', async_script)
    return new Promise((resolve, reject) => {
        try {
            (async() => {
                const result = await eval(`(async () => { ${script} })()`);
                console.log('evalAsync result',result)
                resolve(result);
            })();



            // const result = eval(script);
            // if (result instanceof Promise) {
            //     result.then(resolve).catch(reject);
            // } else {
            //     resolve(result);
            // }
        } catch (error) {
            reject(error);
        }

    });
}

// ****************************************
// ETC Event Listener
// ****************************************

const activeTabButtons = document.getElementsByClassName("tab-button active")
    for (let i=0; i < activeTabButtons.length; i++) {
        activeTabButtons[i].addEventListener('click',(event) => {
            const tabName = event.target.dataset.tab
            openTab(event, tabName)
        });
    }

const inactiveTabButtons = document.getElementsByClassName("tab-button")
    for (let i=0; i < inactiveTabButtons.length; i++) {
        inactiveTabButtons[i].addEventListener('click',(event) => {
            const tabName = event.target.dataset.tab
            openTab(event, tabName)
        });
    }

// document.getElementsByClassName("tab-button").addEventListener('click',(event) => {
//     const tabName = event.target.dataset.tabId
//     openTab(event, tabName)
// });
// document.getElementsByClassName("tab-button").addEventListener('click', openTab)


// ****************************************************************************
// function declaration
// ****************************************************************************

function openTab(event, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i=0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active")
    }
    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i=0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active")
    }
    event.currentTarget.classList.add("active")
    document.getElementById(tabName).classList.add("active")
}

function updateGPIOStates(gpioStates) {
    // Implement GPIO state update using WebHID API
    for (let i = 0; i < gpioStates.length; i++) {
        const ledElement = document.getElementById(`led-gpio${i}`);
        if (gpioStates[i] === 1) {
            ledElement.style.backgroundColor = 'green';
        } else {
            ledElement.style.backgroundColor = 'red';
        }
    }
    // logMessage('updateGPIOStates finished')

}

function updateGPIOState(pin, gpioState) {
    // Implement GPIO state update using WebHID API
    const ledElement = document.getElementById(`led-gpio${pin}`);
    // console.log(pin, gpioState)
    if (gpioState === 1) {
        ledElement.style.backgroundColor = 'green';
    } else {
        ledElement.style.backgroundColor = 'red';
    }
    // logMessage('updateGPIOState finished')
}

async function setGPIO(pin, state) {
    // Implement GPIO set using WebHID API
    if (mcp.device.opened) {
        logMessage(`setGPIO pin ${pin}, ${state}`)
        const gpioState = await mcp.gpioSetPin(pin, state)
        updateGPIOState(pin, gpioState)
    } else {
        logMessage('not connected')
    }
}

async function toggleGPIO(pin) {

    if (mcp.device.opened) {
        const gpioState = await mcp.toggleGpioPin(pin)
        console.log('gpioState',gpioState)
        logMessage(`toggleGPIO pin ${pin} to ${gpioState}`)
        updateGPIOState(pin, gpioState)
    } else {
        logMessage('not connected')
    }

}

function logMessage(...messages) {
  const log = document.getElementById('log');
  const combinedMessage = messages.join(',')
  const timestamp = new Date().toLocaleTimeString('en-US');
  log.textContent += `[${timestamp}],${combinedMessage}\n`;
  log.scrollTop = log.scrollHeight; // Scroll to the bottom
}

function clearlogMessage() {
    const log = document.getElementById('log');
    log.textContent = '';
    log.scrollTop = log.scrollHeight; // Scroll to the bottom
  }

function extractlogMessage() {
    const log = document.getElementById('log');
    const logText = "data:text/csv;charset=utf-8,"+log.textContent;
    const timestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(/:/g, '');

    const fileName = `log_dump_${timestamp}.csv`;
    let encodedUri = encodeURI(logText);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    // 다운로드 링크를 클릭해서 파일 다운로드를 트리거
    document.body.appendChild(link); // 필요한 경우에만 추가
    link.click();
    document.body.removeChild(link); // 클릭 후 링크 제거
  }

function consoleMessage(...messages) {
    const console = document.getElementById('console');
    const combinedMessage = messages.join(' ')
    const timestamp = new Date().toLocaleTimeString();
    console.textContent += `[${timestamp}] ${combinedMessage}\n`;
    console.scrollTop = console.scrollHeight; // Scroll to the bottom
  }

function hexString(num) {
    return num.toString(16).toUpperCase().padStart(4, '0x')
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

