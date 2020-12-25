// Copyright (c) 2020 Curvegrid Inc.

/**
 * Concat logs to return to API call
 */
let log = '';
function loggerAPI(msg) {
  if (msg) {
    log += `${msg}\n`;
  }
  return log;
}

/**
 * Init test with GasT to run tests on Apps Script
 *
 * @param {switchLogger} Switch logger for between GCP and API call
 */
function initTest(customLogger) {
  // GasT Initialization.
  if ((typeof GasTap) === 'undefined') {
    // eslint-disable-next-line no-eval
    eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/huan/gast/93bcc59f1081e1ca3be38b31944ee396d128f5ae/src/gas-tap-lib.js').getContentText());
  }

  if (typeof customLogger !== 'function') {
    // For logging test results on GCP
    return new GasTap();
  }

  // For responding test results to API call
  return new GasTap({
    logger: loggerAPI,
  });
}

/**
 * Run test
 * @param {test} GasT object
 * @param {config} Config object
 * `param {testCase} Test contents object
 */
function run(test, config, testCase) {
  test(testCase.name, (t) => {
    if (testCase.skip) {
      return;
    }

    /* eslint-disable no-undef */
    setProperty(PROP_MB_DEPLOYMENT_ID, config.deployment);
    setProperty(PROP_MB_API_KEY, config.apiKey);
    /* eslint-enable no-undef */

    const output = testCase.func(...testCase.args);
    const numRow = Array.isArray(output) ? output.length : 0;
    const numCol = numRow > 0 ? output[0].length : 0;

    if (testCase.debug) {
      loggerAPI(`OUTPUT: ${output}`);
      loggerAPI(`OUTPUT ROW, COL: ${numRow}, ${numCol}`);
    }

    // Write on test sheet
    config.sheet.clearContents();
    if (numRow > 0 && numCol > 0) {
      config.sheet.getRange(1, 1, numRow, numCol).setValues(output);
    } else {
      config.sheet.getRange(1, 1).setValue(output);
    }
    SpreadsheetApp.flush();

    let actualSheet;
    if (numRow > 0 && numCol > 0) {
      actualSheet = config.sheet.getRange(1, 1, numRow, numCol).getValues();
    } else {
      actualSheet = config.sheet.getRange(1, 1).getValue();
    }

    if (testCase.debug) {
      loggerAPI(`Actual Values: ${JSON.stringify(actualSheet)}`);
      loggerAPI(`Expected Values: ${JSON.stringify(testCase.expected)}`);
    }

    // Actual values which is stored in spreadsheet after API call
    console.log(`Actual vs. Expected: ${JSON.stringify(actualSheet)} vs. ${JSON.stringify(testCase.expected)}`);
    t.deepEqual(actualSheet, testCase.expected, 'data in the sheet should be same');

    // Keep final data in the spreadsheet
    if (!testCase.debug) {
      config.sheet.clearContents();
    }
  });
}

/**
 * Called from outside to run tests and return test results
 */
// eslint-disable-next-line no-unused-vars
function testRunner(testSheetURL) {
  const test = initTest(loggerAPI);
  const ss = SpreadsheetApp.openByUrl(testSheetURL);
  SpreadsheetApp.setActiveSpreadsheet(ss);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  const config = {
    deployment: sheet.getRange('B1').getValue(),
    apiKey: sheet.getRange('B2').getValue(),
    sheet: SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Test'),
  };
  const testCases = [
    {
      name: 'TestMBADDRESS',
      skip: false,
      only: false,
      debug: false,
      func: MBADDRESS,
      isTemplate: false,
      args: ['0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', true, false],
      expected: [
        [
          'label',
          'address',
          'balance',
          'chain',
          'isContract',
          'modules',
          'contracts',
        ],
        [
          'privatefaucet',
          '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7',
          '61000000000000000050',
          'ethereum',
          true,
          '',
          'multibaasfaucet 1.0',
        ],
      ],
    },
    {
      name: 'TestMBADDRESS with code',
      skip: false,
      only: false,
      debug: false,
      func: MBADDRESS,
      isTemplate: false,
      args: ['0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', true, true],
      expected: [
        [
          'label',
          'address',
          'balance',
          'chain',
          'isContract',
          'modules',
          'contracts',
          'codeAt',
        ],
        [
          'privatefaucet',
          '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7',
          '61000000000000000050',
          'ethereum',
          true,
          '',
          'multibaasfaucet 1.0',
          '0x6080604052600436106101145760003560e01c8063893d20e8116100a0578063e64a32d211610064578063e64a32d214610320578063e7f43c6814610335578063f1f959a61461034a578063f8b2cb4f1461035f578063f8e8c47f1461039257610114565b8063893d20e8146102765780638f435f071461028b578063a87430ba146102a0578063d0e30db0146102e5578063de0982a4146102ed57610114565b80633e58c58c116100e75780633e58c58c146101ed5780633f4ba83a1461022057806343b02e0a146102375780634f4b8c001461024c5780638456cb591461026157610114565b80630c432e061461014b5780631c2d3d4914610174578063270edf63146101a75780633ccfd60b146101d8575b60405162461bcd60e51b81526004018080602001828103825260238152602001806113356023913960400191505060405180910390fd5b34801561015757600080fd5b506101606103a7565b604080519115158252519081900360200190f35b34801561018057600080fd5b506101606004803603602081101561019757600080fd5b50356001600160a01b0316610441565b3480156101b357600080fd5b506101bc6105ba565b604080516001600160a01b039092168252519081900360200190f35b3480156101e457600080fd5b506101606105c9565b3480156101f957600080fd5b506101606004803603602081101561021057600080fd5b50356001600160a01b03166106ce565b34801561022c57600080fd5b50610235610981565b005b34801561024357600080fd5b506101bc610a59565b34801561025857600080fd5b50610160610a68565b34801561026d57600080fd5b50610235610b5b565b34801561028257600080fd5b506101bc610c3e565b34801561029757600080fd5b50610160610c4d565b3480156102ac57600080fd5b506102d3600480360360208110156102c357600080fd5b50356001600160a01b0316610cfc565b60408051918252519081900360200190f35b610160610d0e565b3480156102f957600080fd5b506101606004803603602081101561031057600080fd5b50356001600160a01b0316610d4c565b34801561032c57600080fd5b50610160610f1d565b34801561034157600080fd5b506101bc611014565b34801561035657600080fd5b506102d3611023565b34801561036b57600080fd5b506102d36004803603602081101561038257600080fd5b50356001600160a01b0316611027565b34801561039e57600080fd5b50610160611034565b6003546000906001600160a01b031633146103f35760405162461bcd60e51b81526004018080602001828103825260238152602001806113926023913960400191505060405180910390fd5b60028054336001600160a01b031991821681179092556003805490911690556040517fa4d7e78cbe7f44930def1dc63960dd8e4ed6b9ce7b97b357afd463ec8c95862890600090a250600190565b600080546001600160a01b0316331461048f576040805162461bcd60e51b815260206004820152601460248201526000805160206111f8833981519152604482015290519081900360640190fd5b6001546001600160a01b0316156104d75760405162461bcd60e51b81526004018080602001828103825260318152602001806112186031913960400191505060405180910390fd5b6001600160a01b03821661051c5760405162461bcd60e51b81526004018080602001828103825260218152602001806111d76021913960400191505060405180910390fd5b6000546001600160a01b03838116911614156105695760405162461bcd60e51b81526004018080602001828103825260378152602001806112ab6037913960400191505060405180910390fd5b600180546001600160a01b0319166001600160a01b03841690811790915560405133907fc9bcaee7558c5ff2404643f68fa276a8735a0c147123d31d1c3545dba95e727490600090a3506001919050565b6001546001600160a01b031690565b600080546001600160a01b03163314610617576040805162461bcd60e51b815260206004820152601460248201526000805160206111f8833981519152604482015290519081900360640190fd5b60004711610660576040805162461bcd60e51b81526020600482015260116024820152706e6f206661756365742062616c616e636560781b604482015290519081900360640190fd5b6040514790339082156108fc029083906000818181858888f1935050505015801561068f573d6000803e3d6000fd5b5060408051828152905133917fb60710c0d07c81fbd8703b496e191aae3ffc9e6d1ee11f044fb9dbf80f81d8b1919081900360200190a2600191505090565b6002546000906001600160a01b03163314610730576040805162461bcd60e51b815260206004820152601960248201527f73656e6465722073686f756c64206265206f70657261746f7200000000000000604482015290519081900360640190fd5b600154600160a01b900460ff1615610786576040805162461bcd60e51b81526020600482015260146024820152731cda1bdd5b19081b9bdd081899481c185d5cd95960621b604482015290519081900360640190fd5b670de0b6b3a764000047116107db576040805162461bcd60e51b81526020600482015260166024820152753330bab1b2ba1034b99037baba1037b31032ba3432b960511b604482015290519081900360640190fd5b6001600160a01b038216610836576040805162461bcd60e51b815260206004820152601a60248201527f72656365697665722073686f756c64206e6f7420626520307830000000000000604482015290519081900360640190fd5b6001600160a01b038216600090815260046020526040902054421161088c5760405162461bcd60e51b815260040180806020018281038252603e815260200180611249603e913960400191505060405180910390fd5b670de0b6b3a7640000826001600160a01b031631106108dc5760405162461bcd60e51b81526004018080602001828103825260538152602001806112e26053913960600191505060405180910390fd5b6108ee4261546063ffffffff61112d16565b6001600160a01b038316600081815260046020526040808220939093559151670de0b6b3a76400009290839082818181858883f19350505050158015610938573d6000803e3d6000fd5b506040805182815290516001600160a01b038516917f514687833669e436050a6109bfcf65fc63b44af6d5fd457d169761f3c3c89aa2919081900360200190a250600192915050565b6000546001600160a01b031633146109ce576040805162461bcd60e51b815260206004820152601460248201526000805160206111f8833981519152604482015290519081900360640190fd5b600154600160a01b900460ff16610a1f576040805162461bcd60e51b815260206004820152601060248201526f1cda1bdd5b19081899481c185d5cd95960821b604482015290519081900360640190fd5b6001805460ff60a01b1916905560405133907ff779549bb18027d8b598371be0088b09fcca4a91e09288bc6fc485e0865b52d690600090a2565b6003546001600160a01b031690565b600080546001600160a01b03163314610ab6576040805162461bcd60e51b815260206004820152601460248201526000805160206111f8833981519152604482015290519081900360640190fd5b6002546001600160a01b0316610b0b576040805162461bcd60e51b81526020600482015260156024820152746e6f206f70657261746f7220746f207265766f6b6560581b604482015290519081900360640190fd5b6002546040516001600160a01b039091169033907fedc095f99476acb6b4bcdc9715767369f8d423a2ca208c458234b1addabebf1490600090a350600280546001600160a01b0319169055600190565b6000546001600160a01b03163314610ba8576040805162461bcd60e51b815260206004820152601460248201526000805160206111f8833981519152604482015290519081900360640190fd5b600154600160a01b900460ff1615610bfe576040805162461bcd60e51b81526020600482015260146024820152731cda1bdd5b19081b9bdd081899481c185d5cd95960621b604482015290519081900360640190fd5b6001805460ff60a01b1916600160a01b17905560405133907fce3af5a3fdaee3c4327c1c434ea1d2186d7a9495f005d2a876dca182bd14571490600090a2565b6000546001600160a01b031690565b6001546000906001600160a01b03163314610caf576040805162461bcd60e51b815260206004820152601760248201527f73686f756c64206e6f742061636365707420616761696e000000000000000000604482015290519081900360640190fd5b60008054336001600160a01b0319918216811783556001805490921690915560405190917f2f68a0b3010e34d13a0d06c38a40584536548684eb0056ede21aaf532de3bc4b91a250600190565b60046020526000908152604090205481565b60408051348152905160009133917f62fde48a1f1e1f53dbcc1bdf035a07786f0bb6b69ec77b897bd1f42f4cd735a39181900360200190a250600190565b600080546001600160a01b03163314610d9a576040805162461bcd60e51b815260206004820152601460248201526000805160206111f8833981519152604482015290519081900360640190fd5b6003546001600160a01b031615610de25760405162461bcd60e51b81526004018080602001828103825260228152602001806111b56022913960400191505060405180910390fd5b6001600160a01b038216610e275760405162461bcd60e51b81526004018080602001828103825260248152602001806112876024913960400191505060405180910390fd5b610e2f610c3e565b6001600160a01b0316826001600160a01b03161415610e7f5760405162461bcd60e51b815260040180806020018281038252602681526020018061118f6026913960400191505060405180910390fd5b6002546001600160a01b0383811691161415610ecc5760405162461bcd60e51b815260040180806020018281038252603a815260200180611358603a913960400191505060405180910390fd5b600380546001600160a01b0319166001600160a01b03841690811790915560405133907f8524af1c68633766abb9b9dd9284a71f054a6c21cebc36c0a0dc9d70bcfa5fbb90600090a3506001919050565b600080546001600160a01b03163314610f6b576040805162461bcd60e51b815260206004820152601460248201526000805160206111f8833981519152604482015290519081900360640190fd5b6001546001600160a01b0316610fc8576040805162461bcd60e51b815260206004820152601c60248201527f6e6f206f776e65722063616e64696461746520746f207265766f6b6500000000604482015290519081900360640190fd5b6001546040516001600160a01b03909116907f1666cd85208a12e36d84f0213694d7fa987cc021f41c91a4520950176d98293790600090a250600180546001600160a01b031916815590565b6002546001600160a01b031690565b4790565b6001600160a01b03163190565b600080546001600160a01b03163314611082576040805162461bcd60e51b815260206004820152601460248201526000805160206111f8833981519152604482015290519081900360640190fd5b6003546001600160a01b03166110df576040805162461bcd60e51b815260206004820152601f60248201527f6e6f206f70657261746f722063616e64696461746520746f207265766f6b6500604482015290519081900360640190fd5b6003546040516001600160a01b03909116907fcb4610e28c7f8296925fbbec63951ed15ed3092521ea2490d967d215a36c277790600090a250600380546001600160a01b0319169055600190565b600082820183811015611187576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b939250505056fe6f70657261746f722063616e6469646174652073686f756c64206e6f74206265206f776e65726f70657261746f722063616e6469646174652073686f756c6420626520756e7365746f776e65722063616e6469646174652073686f756c64206e6f742062652030783073686f756c64206265206f6e6c79206f776e657200000000000000000000000073686f756c64206e6f742072657175657374207468652073616d65206f776e65722063616e64696461746520616761696e72656365697665722063616e206f6e6c792072657175657374206574686572206f6e636520696e20612073697820686f75722074696d652077696e646f776f70657261746f722063616e6469646174652073686f756c64206e6f74206265203078306f776e65722063616e6469646174652073686f756c64206e6f74206265207468652073616d652077697468207468652063757272656e7466617563657420776f6e27742073656e6420657468657220746f20726563697069656e7473207769746820612062616c616e63652067726561746572207468616e206f7220657175616c20746f2031206574686e6f7420616c6c6f7720746f2063616c6c2066616c6c6261636b2066756e6374696f6e6f70657261746f722063616e6469646174652073686f756c64206e6f74206265207468652073616d652077697468207468652063757272656e7473656e6465722073686f756c64206265206f70657261746f722063616e646964617465a265627a7a72315820a1887191706f4f62020796e883a22a5f25ad857f517fb96d3afda2390b84d13a64736f6c63430005110032',
        ],
      ],
    },
    {
      name: 'TestMBBLOCK',
      skip: false,
      only: false,
      debug: false,
      func: MBBLOCK,
      isTemplate: false,
      args: [1],
      expected: [
        [
          'blockchain',
          'hash',
          'difficulty',
          'gasLimit',
          'number',
          'timestamp',
          'receipt',
          'txHashes',
        ],
        [
          'ethereum',
          '0x91b8583852f0244b4c4969bef7c456898fa16d0dde5e328e4c6c0e2c086136bf',
          2,
          9990236,
          1,
          formatDateTime('2020-05-20T08:38:13.000Z'),
          '0x056b23fbba480696b65fe5a59b8f2148a1299103c4f57df839233af2cf4ca2d2',
          '0x9157a6ce0112ed417e3bda098af4fe63afbfa8af769debba3534ee24891a2050',
        ],
      ],
    },
    {
      name: 'TestMBCOMPOSE',
      skip: false,
      only: false,
      debug: false,
      func: MBCOMPOSE,
      isTemplate: false,
      args: [
        'privatefaucet',
        'multibaasfaucet',
        'deposit',
        '0xA616eEd6aD7A0cF5d2388301a710c273ca955e05',
        '0xA616eEd6aD7A0cF5d2388301a710c273ca955e05',
        '100000000000000000',
      ],
      expected: JSON.stringify({
        from: '0xA616eEd6aD7A0cF5d2388301a710c273ca955e05',
        to: '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7',
        value: '100000000000000000',
        gas: 22774,
        gasPrice: '122000000000',
        data: '0xd0e30db0',
        nonce: 6,
        hash: '0x8bb80aa0ef08ff080eaeb5b06b176acbecb2d8c0136cb91dc2ef0a3f96c9974f',
      }),
    },
    {
      name: 'TestMBCUSTOMQUERY with no data',
      skip: false,
      only: false,
      debug: false,
      func: MBCUSTOMQUERY,
      isTemplate: false,
      args: [
        [
          [
            'eventName',
            'alias',
            'index',
            'aggregator',
            'alias',
            'index',
            'aggregator',
            'rule',
            'operand',
            'operator',
            'value',
            'rule',
            'operand',
            'operator',
            'value',
            'rule',
            'operand',
            'operator',
            'value',
          ],
          [
            'LogDeposited(address,uint256)',
            'sender',
            0,
            '',
            'amount',
            1,
            '',
            'and',
            'input0',
            'equal',
            '0x89d048be68575f2b56a999ba24faacabd1b919fb',
            'and',
            'input1',
            'greaterthan',
            1,
            'and:and',
            'block_number',
            'greaterthan',
            1,
          ],
        ],
        '',
        '',
        3,
        100000,
      ],
      expected: [],
    },
    {
      name: 'TestMBCUSTOMQUERY with filters',
      skip: false,
      only: false,
      debug: false,
      func: MBCUSTOMQUERY,
      isTemplate: false,
      args: [
        // Filters structure
        // "filter": {
        //   "rule": "And",
        //   "children": [
        //     {
        //       "operator": "Equal",
        //       "value": "0x89d048be68575f2b56a999ba24faacabd1b919fb",
        //       "fieldType": "input",
        //       "inputIndex": 0
        //     },
        //     {
        //       "operator": "GreaterThan",
        //       "value": "1",
        //       "fieldType": "input",
        //       "inputIndex": 1
        //     },
        //     {
        //       "rule": "And",
        //       "children": [
        //         {
        //           "operator": "GreaterThan",
        //           "value": "1",
        //           "fieldType": "block_number"
        //         }
        //       ]
        //     }
        //   ]
        // }
        [
          [
            'eventName',
            'alias',
            'index',
            'aggregator',
            'alias',
            'index',
            'aggregator',
            'rule',
            'operand',
            'operator',
            'value',
            'rule',
            'operand',
            'operator',
            'value',
            'rule',
            'operand',
            'operator',
            'value',
          ],
          [
            'LogDeposited(address,uint256)',
            'sender',
            0,
            '',
            'amount',
            1,
            '',
            'and',
            'input0',
            'equal',
            '0x89d048be68575f2b56a999ba24faacabd1b919fb',
            'and',
            'input1',
            'greaterthan',
            1,
            'and:and',
            'block_number',
            'greaterthan',
            1,
          ],
        ],
        '',
        '',
        3,
        0,
      ],
      expected: [
        ['sender', 'amount'],
        ['0x89d048be68575f2b56a999ba24faacabd1b919fb', 1e+27],
      ],
    },
    {
      name: 'TestMBCUSTOMQUERY with no filter',
      skip: false,
      only: false,
      debug: false,
      func: MBCUSTOMQUERY,
      isTemplate: false,
      args: [
        [
          ['eventName', 'alias', 'index', 'aggregator', 'alias', 'index', 'aggregator'],
          ['LogDeposited(address,uint256)', 'sender', 0, '', 'amount', 1, ''],
        ],
        '',
        '',
        3,
        0,
      ],
      expected: [
        ['sender', 'amount'],
        ['0x89d048be68575f2b56a999ba24faacabd1b919fb', 1e+27],
        ['0xa616eed6ad7a0cf5d2388301a710c273ca955e05', 1000000000000000000],
        ['0xbac1cd4051c378bf900087ccc445d7e7d02ad745', 1000000000000000000],
      ],
    },
    {
      name: 'TestMBCUSTOMQUERY without limit (default is 10) and offset (default is 0)',
      skip: false,
      only: false,
      debug: false,
      func: MBCUSTOMQUERY,
      isTemplate: false,
      args: [
        [
          ['eventName', 'alias', 'index', 'aggregator', 'alias', 'index', 'aggregator', 'rule', 'operand', 'operator', 'value'],
          ['LogDeposited(address,uint256)', 'sender', 0, '', 'amount', 1, '', 'And', 'contract_address_label', 'Equal', 'privatefaucet'],
        ],
      ],
      expected: [
        ['sender', 'amount'],
        ['0xa616eed6ad7a0cf5d2388301a710c273ca955e05', 1000000000000000000],
        ['0xbac1cd4051c378bf900087ccc445d7e7d02ad745', 1000000000000000000],
        ['0x0d6c3707a98bce1a56247555c8b74242705b8acf', 50],
        ['0x0d6c3707a98bce1a56247555c8b74242705b8acf', 50000000000000000000],
        ['0x005080f78567f8001115f1eee835dd0151bea476', 50000000000000000000],
      ],
    },
    {
      name: 'TestMBCUSTOMQUERY without limit 1 and offset 1',
      skip: false,
      only: false,
      debug: false,
      func: MBCUSTOMQUERY,
      isTemplate: false,
      args: [
        [
          ['eventName', 'alias', 'index', 'aggregator', 'alias', 'index', 'aggregator'],
          ['LogDeposited(address,uint256)', 'sender', 0, '', 'amount', 1, ''],
        ],
        '',
        '',
        1,
        1,
      ],
      expected: [
        ['sender', 'amount'],
        ['0xa616eed6ad7a0cf5d2388301a710c273ca955e05', 1000000000000000000],
      ],
    },
    // TODO: try after https://github.com/curvegrid/multibaas-for-google-sheets/issues/53
    {
      name: 'TestMBCUSTOMQUERY with wrong selected range',
      skip: true,
      only: false,
      debug: false,
      func: MBCUSTOMQUERY,
      isTemplate: false,
      args: [
        [
          ['eventName', 'alias', 'index', 'aggregator', 'alias', 'index', 'aggregator', undefined],
          ['LogDeposited(address,uint256)', 'sender', 0, '', 'amount', 1, '', undefined],
        ],
        '',
        '',
        1,
        1,
      ],
      expected: ['#ERROR!'],
    },
    {
      name: 'TestMBCUSTOMQUERYTEMPLATE with 2 filters',
      skip: false,
      only: false,
      debug: false,
      func: MBCUSTOMQUERYTEMPLATE,
      isTemplate: true,
      args: [2, 2],
      expected: [['eventName', 'alias', 'index', 'aggregator', 'alias', 'index', 'aggregator', 'rule', 'operand', 'operator', 'value', 'rule', 'operand', 'operator', 'value']],
    },
    {
      name: 'TestMBCUSTOMQUERYTEMPLATE with No filter',
      skip: false,
      only: false,
      debug: false,
      func: MBCUSTOMQUERYTEMPLATE,
      isTemplate: true,
      args: [2, 0],
      expected: [['eventName', 'alias', 'index', 'aggregator', 'alias', 'index', 'aggregator']],
    },
    {
      name: 'TestMBEVENTLIST',
      skip: false,
      only: false,
      debug: false,
      func: MBEVENTLIST,
      isTemplate: false,
      args: ['multibaasfaucet'],
      expected: [
        ['event', 'description', 'inputs'],
        ['LogCurrentOperatorRevoked', '', '2 inputs:\nowner address\noperatorRevoked address'],
        ['LogDeposited', '', '2 inputs:\nsender address\namount uint256'],
        ['LogOperatorCandidateAccepted', '', '1 input:\ncandidateAccepted address'],
        ['LogOperatorCandidateRequested', '', '2 inputs:\nowner address\ncandidate address'],
        ['LogOperatorCandidateRevoked', '', '1 input:\ncandidateRevoked address'],
        ['LogOwnerCandidateAccepted', '', '1 input:\ncandidateAccepted address'],
        ['LogOwnerCandidateRequested', '', '2 inputs:\nowner address\ncandidate address'],
        ['LogOwnerCandidateRevoked', '', '1 input:\ncandidateRevoked address'],
        ['LogPaused', '', '1 input:\nowner address'],
        ['LogSent', '', '2 inputs:\nreceiver address\namount uint256'],
        ['LogUnpaused', '', '1 input:\nowner address'],
        ['LogWithdrew', '', '2 inputs:\nowner address\namount uint256'],
      ],
    },
    {
      name: 'TestMBEVENTS without limit (default is 10) and offset (default is 0)',
      skip: false,
      only: false,
      debug: false,
      func: MBEVENTS,
      isTemplate: false,
      args: ['privatefaucet'],
      expected: [
        [
          'triggeredAt',
          'eventName',
          'eventDef',
          'eventInput0',
          'eventInput1',
          'eventIndexInLog',
          'eventContractAddressLabel',
          'eventContractAddress',
          'eventContractName',
          'txFrom',
          'txData',
          'txHash',
          'txIndexInBlock',
          'txBlockHash',
          'txBlockNumber',
          'txContractAddressLabel',
          'txContractAddress',
          'txContractName',
          'fnName',
          'fnDef',
          'methodInput0',
        ],
        [formatDateTime('2020-12-25T05:12:37.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x3F37278403BF4Fa7c2B8fa0D21Af353c554641A1', 1000000000000000000, formatDateTime('1899-12-29T15:00:00.000Z'), 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000003f37278403bf4fa7c2b8fa0d21af353c554641a1', '0x956bb32dd9bf75c5a2fbb485894903efce2719ed7202828e11df2d3aeb417310', 0, '0x2f14f02323c33f1e1594855dc4a45ac222b1c22f5f2353e4447981f79b163bd0', 687, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x3F37278403BF4Fa7c2B8fa0D21Af353c554641A1'],
        [formatDateTime('2020-12-25T14:12:17.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x672b39F0D2609a6FeC23358f4b8D8c92104BAF56', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000672b39f0d2609a6fec23358f4b8d8c92104baf56', '0xfe3925b2fd1b2ca52f9c7813a370b4f5652898b1c973ec6499c945993697771c', 0, '0x6073c2ed1e0208930fa46838663353ef968295715aea8b253cd128e1f0ee267a', 686, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x672b39F0D2609a6FeC23358f4b8D8c92104BAF56'],
        [formatDateTime('2020-12-25T04:33:57.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xA3A365e5319C4C17115d4Ce41f2A2A280c99A545', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000a3a365e5319c4c17115d4ce41f2a2a280c99a545', '0xa45f0490dec03e9b1100d8c28b23518b3fdbe44b570ef24713355ea288e643cd', 0, '0x26e7306ffe3c9471767b3ad007a1c0c8dbe7575efcf670f494f2621227bc162e', 646, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xA3A365e5319C4C17115d4Ce41f2A2A280c99A545'],
        [formatDateTime('2020-12-24T12:14:38.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x083cA7991089B6Ba225cE5C7Ac1182194Fecd802', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000083ca7991089b6ba225ce5c7ac1182194fecd802', '0xb2b1437f1511c9cf53bb785fb4d6cece1cb08144dc35bf87d3572c2719c6cf33', 0, '0x42bfbc1a41c86bfdff58c248c2c324a07960a7d73b92598008c12f97b0cb38b1', 640, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x083cA7991089B6Ba225cE5C7Ac1182194Fecd802'],
        [formatDateTime('2020-12-24T12:10:13.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xbF95768D6F4CFf0f6f8C6cB2898104141164Cf0F', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000bf95768d6f4cff0f6f8c6cb2898104141164cf0f', '0x84b5ba9545efe5f8f2f15997b087760fa74f693f6afb496d7c6f13c7131661fb', 0, '0x0779453760d8ba886355219fdc97205a61df093c1b652f9cc277fdb1a0f4fc75', 639, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xbF95768D6F4CFf0f6f8C6cB2898104141164Cf0F'],
        [formatDateTime('2020-12-24T12:09:24.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xe7b8fa23e18bF155834Fb9e7aBf580102D8Df788', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000e7b8fa23e18bf155834fb9e7abf580102d8df788', '0x3a099dba98e6db05629d8e2d25b2ba6be348a9c7cec05618ee65d2e684a3dddf', 0, '0x5f5324844ee443e54e497d8bf5d42f2326b29def5ea5d6f4176a607a7159e7d1', 638, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xe7b8fa23e18bF155834Fb9e7aBf580102D8Df788'],
        [formatDateTime('2020-12-24T12:08:59.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xa5e05879388cF0aE4397903C8B0932e4Cc692C0c', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000a5e05879388cf0ae4397903c8b0932e4cc692c0c', '0xbbebbfe2d844099aeb58794d462f9857194ecc1a468f455b57e78326d2494c64', 0, '0x45184a5273860c2b0977488167516248e955d2bcded8f43f41c1f665b0d0b19b', 637, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xa5e05879388cF0aE4397903C8B0932e4Cc692C0c'],
        [formatDateTime('2020-12-24T12:08:31.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x3886b402D099BaF00327B688ee0cBfbfd62c2A43', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000003886b402d099baf00327b688ee0cbfbfd62c2a43', '0x18eb828bab2426e151369d78fa22ddaefb2d64612b60fef08fa81cf1a2174c00', 0, '0x0421cd20119f7a0c82e7c1722a01ce08dcf72f8faff1ecde71eab4b8f54306b1', 636, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x3886b402D099BaF00327B688ee0cBfbfd62c2A43'],
        [formatDateTime('2020-12-24T12:08:24.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x6bcC247390B94645F503AD3fC10778850CCFAd60', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000006bcc247390b94645f503ad3fc10778850ccfad60', '0xd6be7c8d5b00b824c8270372b5388f5e30bb60ba0da1fde665e22e511d3f8d3e', 0, '0x6fe2c83cb60178f48314c04cad711ec6b8af732e165542dbcc683910eb2d5613', 635, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x6bcC247390B94645F503AD3fC10778850CCFAd60'],
        [formatDateTime('2020-12-24T12:08:17.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x0522e43a549d45BC6eaAcB0CEf9af0925f122B3E', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000000522e43a549d45bc6eaacb0cef9af0925f122b3e', '0x7c344b6170bc035d266d6e54cb919a4fed825857afe0b0566712c71b2f0b5dcf', 0, '0x508c8ea364e77fbcb24b0e174ced1f78dfb692e4d1de2657ddd61910891cb2be', 634, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x0522e43a549d45BC6eaAcB0CEf9af0925f122B3E'],
      ],
    },
    {
      name: 'TestMBEVENTS with limit 1 and no offset (default is 0)',
      skip: false,
      only: false,
      debug: false,
      func: MBEVENTS,
      isTemplate: false,
      args: ['privatefaucet', 1],
      expected: [
        [
          'triggeredAt',
          'eventName',
          'eventDef',
          'eventInput0',
          'eventInput1',
          'eventIndexInLog',
          'eventContractAddressLabel',
          'eventContractAddress',
          'eventContractName',
          'txFrom',
          'txData',
          'txHash',
          'txIndexInBlock',
          'txBlockHash',
          'txBlockNumber',
          'txContractAddressLabel',
          'txContractAddress',
          'txContractName',
          'fnName',
          'fnDef',
          'methodInput0',
        ],
        [formatDateTime('2020-12-25T05:12:37.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x3F37278403BF4Fa7c2B8fa0D21Af353c554641A1', 1000000000000000000, formatDateTime('1899-12-29T15:00:00.000Z'), 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000003f37278403bf4fa7c2b8fa0d21af353c554641a1', '0x956bb32dd9bf75c5a2fbb485894903efce2719ed7202828e11df2d3aeb417310', 0, '0x2f14f02323c33f1e1594855dc4a45ac222b1c22f5f2353e4447981f79b163bd0', 687, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x3F37278403BF4Fa7c2B8fa0D21Af353c554641A1'],
      ],
    },
    {
      name: 'TestMBEVENTS with limit 39 and offset 1',
      skip: false,
      only: false,
      debug: false,
      func: MBEVENTS,
      isTemplate: false,
      args: ['privatefaucet', 39, 1],
      expected: [
        [
          'triggeredAt',
          'eventName',
          'eventDef',
          'eventInput0',
          'eventInput1',
          'eventIndexInLog',
          'eventContractAddressLabel',
          'eventContractAddress',
          'eventContractName',
          'txFrom',
          'txData',
          'txHash',
          'txIndexInBlock',
          'txBlockHash',
          'txBlockNumber',
          'txContractAddressLabel',
          'txContractAddress',
          'txContractName',
          'fnName',
          'fnDef',
          'methodInput0',
        ],
        [formatDateTime('2020-12-25T05:12:17.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x672b39F0D2609a6FeC23358f4b8D8c92104BAF56', 1000000000000000000, formatDateTime('1899-12-29T15:00:00.000Z'), 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000672b39f0d2609a6fec23358f4b8d8c92104baf56', '0xfe3925b2fd1b2ca52f9c7813a370b4f5652898b1c973ec6499c945993697771c', 0, '0x6073c2ed1e0208930fa46838663353ef968295715aea8b253cd128e1f0ee267a', 686, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x672b39F0D2609a6FeC23358f4b8D8c92104BAF56'],
        [formatDateTime('2020-12-25T04:33:57.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xA3A365e5319C4C17115d4Ce41f2A2A280c99A545', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000a3a365e5319c4c17115d4ce41f2a2a280c99a545', '0xa45f0490dec03e9b1100d8c28b23518b3fdbe44b570ef24713355ea288e643cd', 0, '0x26e7306ffe3c9471767b3ad007a1c0c8dbe7575efcf670f494f2621227bc162e', 646, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xA3A365e5319C4C17115d4Ce41f2A2A280c99A545'],
        [formatDateTime('2020-12-24T12:14:38.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x083cA7991089B6Ba225cE5C7Ac1182194Fecd802', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000083ca7991089b6ba225ce5c7ac1182194fecd802', '0xb2b1437f1511c9cf53bb785fb4d6cece1cb08144dc35bf87d3572c2719c6cf33', 0, '0x42bfbc1a41c86bfdff58c248c2c324a07960a7d73b92598008c12f97b0cb38b1', 640, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x083cA7991089B6Ba225cE5C7Ac1182194Fecd802'],
        [formatDateTime('2020-12-24T12:10:13.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xbF95768D6F4CFf0f6f8C6cB2898104141164Cf0F', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000bf95768d6f4cff0f6f8c6cb2898104141164cf0f', '0x84b5ba9545efe5f8f2f15997b087760fa74f693f6afb496d7c6f13c7131661fb', 0, '0x0779453760d8ba886355219fdc97205a61df093c1b652f9cc277fdb1a0f4fc75', 639, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xbF95768D6F4CFf0f6f8C6cB2898104141164Cf0F'],
        [formatDateTime('2020-12-24T12:09:24.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xe7b8fa23e18bF155834Fb9e7aBf580102D8Df788', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000e7b8fa23e18bf155834fb9e7abf580102d8df788', '0x3a099dba98e6db05629d8e2d25b2ba6be348a9c7cec05618ee65d2e684a3dddf', 0, '0x5f5324844ee443e54e497d8bf5d42f2326b29def5ea5d6f4176a607a7159e7d1', 638, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xe7b8fa23e18bF155834Fb9e7aBf580102D8Df788'],
        [formatDateTime('2020-12-24T12:08:59.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xa5e05879388cF0aE4397903C8B0932e4Cc692C0c', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000a5e05879388cf0ae4397903c8b0932e4cc692c0c', '0xbbebbfe2d844099aeb58794d462f9857194ecc1a468f455b57e78326d2494c64', 0, '0x45184a5273860c2b0977488167516248e955d2bcded8f43f41c1f665b0d0b19b', 637, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xa5e05879388cF0aE4397903C8B0932e4Cc692C0c'],
        [formatDateTime('2020-12-24T12:08:31.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x3886b402D099BaF00327B688ee0cBfbfd62c2A43', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000003886b402d099baf00327b688ee0cbfbfd62c2a43', '0x18eb828bab2426e151369d78fa22ddaefb2d64612b60fef08fa81cf1a2174c00', 0, '0x0421cd20119f7a0c82e7c1722a01ce08dcf72f8faff1ecde71eab4b8f54306b1', 636, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x3886b402D099BaF00327B688ee0cBfbfd62c2A43'],
        [formatDateTime('2020-12-24T12:08:24.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x6bcC247390B94645F503AD3fC10778850CCFAd60', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000006bcc247390b94645f503ad3fc10778850ccfad60', '0xd6be7c8d5b00b824c8270372b5388f5e30bb60ba0da1fde665e22e511d3f8d3e', 0, '0x6fe2c83cb60178f48314c04cad711ec6b8af732e165542dbcc683910eb2d5613', 635, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x6bcC247390B94645F503AD3fC10778850CCFAd60'],
        [formatDateTime('2020-12-24T12:08:17.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x0522e43a549d45BC6eaAcB0CEf9af0925f122B3E', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000000522e43a549d45bc6eaacb0cef9af0925f122b3e', '0x7c344b6170bc035d266d6e54cb919a4fed825857afe0b0566712c71b2f0b5dcf', 0, '0x508c8ea364e77fbcb24b0e174ced1f78dfb692e4d1de2657ddd61910891cb2be', 634, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x0522e43a549d45BC6eaAcB0CEf9af0925f122B3E'],
        [formatDateTime('2020-12-24T12:08:09.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x887FF03567C6007451c8326EFa7665cCfe2f75e1', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000887ff03567c6007451c8326efa7665ccfe2f75e1', '0x9338fec9ab50f85834eee727d3e4670813eaaa5c5a0c2b40a18681759a7ff3e7', 0, '0x54004a188f8d48578f2a9bb602ffd22dd32b21942b5099dca709db94db13b533', 633, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x887FF03567C6007451c8326EFa7665cCfe2f75e1'],
        [formatDateTime('2020-12-24T12:08:01.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x0669d51850297024791cF17Fe0B9c4587537F0A1', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000000669d51850297024791cf17fe0b9c4587537f0a1', '0x18f655500354b694b4d5ffbfda21f076ee864f8b2bda850c4800d25c05e0171a', 0, '0xf1ad881056bb8ea27de66294c6dd77bc7bdfb9769cb01152714ea97f09bbb188', 632, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x0669d51850297024791cF17Fe0B9c4587537F0A1'],
        [formatDateTime('2020-12-24T12:07:53.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x042Fa85cB1cc3cCe6d96CAbd89C92c0F0E5816b8', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000042fa85cb1cc3cce6d96cabd89c92c0f0e5816b8', '0xd600b6cfc5e564a2c183e992fad4d6d82af1347cc9b009da53738a54505e2625', 0, '0xaf5c60bf6166fc1923b7559780be9c738e7fca6cdf81da6d941fd2be3c66ee41', 631, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x042Fa85cB1cc3cCe6d96CAbd89C92c0F0E5816b8'],
        [formatDateTime('2020-12-24T12:07:46.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xF17Fe17Cd4d879a0c0Ae414977337E996E73e787', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000f17fe17cd4d879a0c0ae414977337e996e73e787', '0x04ed836c241e4e46bf06c9e6af438bd08767e9d7540d0a5af53adb203be4756f', 0, '0x3c30beceb9eb21ba981cffdadb6e2510a49d84f48dceed3dcd2e874833d7305f', 630, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xF17Fe17Cd4d879a0c0Ae414977337E996E73e787'],
        [formatDateTime('2020-12-24T12:07:34.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x6FF08E74456273408c52910Ad1fFd3aa1AcF4296', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000006ff08e74456273408c52910ad1ffd3aa1acf4296', '0x858dba55b45e6a7d71f570ec4e47164e8f8015fddc8daa3ab292d66bc9063372', 0, '0x756480b7bf95e16d50d54cc314e41170094f9ace74e53715a4bc6b83325cea58', 629, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x6FF08E74456273408c52910Ad1fFd3aa1AcF4296'],
        [formatDateTime('2020-12-24T12:07:27.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x31C26FD17D164F65485cC122d4a7D169273E6513', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c00000000000000000000000031c26fd17d164f65485cc122d4a7d169273e6513', '0x2ba0cffc2f7269c5d6efce137cf4b142bef41d8f0233649d50c4fc86bfe34262', 0, '0x9d17ef32e8370a7e19b5e2a54fc9e458b6db51101f71a1a07e9fc109b130f0a9', 628, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x31C26FD17D164F65485cC122d4a7D169273E6513'],
        [formatDateTime('2020-12-24T12:07:19.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xDcd5C8b12183fC29091C071Ea0b785648c280D18', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000dcd5c8b12183fc29091c071ea0b785648c280d18', '0xdd7990c5f911756739b4f7f04a599af77b86a5c3c0850ff7c8f372594bdd3936', 0, '0x6486fa024a4c762145b5851a2994eb3c0201207fb25f85ec64ff02de36e560df', 627, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xDcd5C8b12183fC29091C071Ea0b785648c280D18'],
        [formatDateTime('2020-12-24T12:07:12.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x621f1722dcb7fff551d0aA19c54559fbd3bd49C7', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000621f1722dcb7fff551d0aa19c54559fbd3bd49c7', '0xaa299583ddb9b72a91904113bfcdd953b68f0a088329cf73818c68436203ae1c', 0, '0x32428457e988b17247e20aa233a1055f9667f31741114c9acd3a8ddef70f29fa', 626, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x621f1722dcb7fff551d0aA19c54559fbd3bd49C7'],
        [formatDateTime('2020-12-24T12:07:04.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x80Db50D26d67d6D2Eb860F89B2E00e64cc4D4Cf8', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c00000000000000000000000080db50d26d67d6d2eb860f89b2e00e64cc4d4cf8', '0x4ec4dec84b9487a46b1000ef4367a6a6c92948238acce5f3bd496adb1ac34c69', 0, '0x7ae2aff0d6cdb0b9013126a8d67f2ffbfe4a8f31304ff868baebb58396de9531', 625, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x80Db50D26d67d6D2Eb860F89B2E00e64cc4D4Cf8'],
        [formatDateTime('2020-12-24T12:06:55.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xF78DBe4B5ad7449C5e90A67f769E80D5EfE5CEF2', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000f78dbe4b5ad7449c5e90a67f769e80d5efe5cef2', '0x899c46089ac36359ecfbaf130c60025ef5f3aeb1573dbefefe5fbb038b0cf7f5', 0, '0x08fdfc1cb45405322852442f5a612c5e05dc5bcdc57e22d3fc84c8249accd7bd', 624, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xF78DBe4B5ad7449C5e90A67f769E80D5EfE5CEF2'],
        [formatDateTime('2020-12-24T12:06:45.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x20F0f7d93d451b650a45207d67e5B7Ba29684DD4', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c00000000000000000000000020f0f7d93d451b650a45207d67e5b7ba29684dd4', '0x405d869dded3938e6764eb22d8444de96dc85a861867f729a9adbf301dcc97b6', 0, '0xe61637d718f9ec4a393b650ac73f09c833df20cafd4e65687a0702f69a221d90', 623, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x20F0f7d93d451b650a45207d67e5B7Ba29684DD4'],
        [formatDateTime('2020-12-24T12:06:37.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xd8981f7dF510F5e6b81BaFe402188611E158bF5C', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000d8981f7df510f5e6b81bafe402188611e158bf5c', '0x5f56baf5a60e3f489b27fd48f8b52e63fe1d74510ecedb09d335e7c54c3d59a6', 0, '0xf9cfa69543e9b3560b49d8d9a80e88322366e08e051a79f3546a6d99e4ff6f51', 622, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xd8981f7dF510F5e6b81BaFe402188611E158bF5C'],
        [formatDateTime('2020-12-24T12:06:29.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xba7B348A5Efa84B8DD4B837BAe05B89A1Da39C12', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000ba7b348a5efa84b8dd4b837bae05b89a1da39c12', '0xcdf8da7f2b3427cc2962518c0831939a5db7653025e7f56c76aec69141b290de', 0, '0x6250ffe7feb3f1f6a055306c7cec0428e61aedd0fac666cd41491245fb265306', 621, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xba7B348A5Efa84B8DD4B837BAe05B89A1Da39C12'],
        [formatDateTime('2020-12-24T12:06:21.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x1fF3A8cDAC56E66173E4e71A36c33525BE6b31eC', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000001ff3a8cdac56e66173e4e71a36c33525be6b31ec', '0x5a80de712ae2e755f0e48dd57c0b96127ef5afbe849d6310ed7ca9a05cc80c5e', 0, '0x402ce3c2e422c38f77041a88354fbd8e9bcb2993ffb4dc7782fe23ab0ff6326c', 620, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x1fF3A8cDAC56E66173E4e71A36c33525BE6b31eC'],
        [formatDateTime('2020-12-24T12:06:13.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x6B2A5a525A34aB5d61BA923c8C87bF4f161b9Eae', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000006b2a5a525a34ab5d61ba923c8c87bf4f161b9eae', '0x0275a2d1b991cc1ce007f0c8e6ec9ffe4efabf3bc682cc5ab389bd0b37f4b75d', 0, '0x90c617c935cf9653ba49c449c70afc0c9fbaf4d23417af50c181425678d346b3', 619, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x6B2A5a525A34aB5d61BA923c8C87bF4f161b9Eae'],
        [formatDateTime('2020-12-24T12:06:04.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x02CF9Cff7ADae5C4287c453510666c6Ef39257dc', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c00000000000000000000000002cf9cff7adae5c4287c453510666c6ef39257dc', '0x2e0c6dc69a6e23108863c3c2b7e91cd5cbd230931502c8b129f9981dd3106e3b', 0, '0xd311c6d9f766b5491db3d7cb2de6e6c104dc709cfd538f08e7e6244e74ba2635', 618, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x02CF9Cff7ADae5C4287c453510666c6Ef39257dc'],
        [formatDateTime('2020-12-24T12:05:57.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x46c52492CeE185D03953D559Db44f5aCC822Ce57', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c00000000000000000000000046c52492cee185d03953d559db44f5acc822ce57', '0x1bd25e5e5586e40a43bd8429f0d0487424a19b816e43bcbe67b044847a24e8ff', 0, '0x59c552ff0e6711d57ef6178ffef9900d987df1cf7fe6732c104fc3b33b6c4bb7', 617, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x46c52492CeE185D03953D559Db44f5aCC822Ce57'],
        [formatDateTime('2020-12-24T12:05:48.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x735D5cc2607044f17dd58610DbfB9799DB0CB8B7', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000735d5cc2607044f17dd58610dbfb9799db0cb8b7', '0x4cbcb81cc286df75987034099ae573b91eaa0b71d2038277351d8ec852e57030', 0, '0xb5a03c6a5fab4b7d6967a25f6c74d2a7c75b0c56653960f0333b1c922f44ae96', 616, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x735D5cc2607044f17dd58610DbfB9799DB0CB8B7'],
        [formatDateTime('2020-12-24T12:05:40.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xD05b9736cb99797b74A703A7C12e793Bb4F821c4', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000d05b9736cb99797b74a703a7c12e793bb4f821c4', '0x61b6ddd6001e3b0c2316bf6e675899beaf32d02edd3c9dbc00637a8ee0a062ab', 0, '0x969ab12cd18941d0b1c065d56cac99627f90d06ef5bb4f76bc6f735480e2c41c', 615, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xD05b9736cb99797b74A703A7C12e793Bb4F821c4'],
        [formatDateTime('2020-12-24T12:05:02.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xCb1665105B18e63f2aA7706201f9B1C55BbCA2E6', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000cb1665105b18e63f2aa7706201f9b1c55bbca2e6', '0x60775c70445e05c02421128867e4f7db9bdb19fdbff8adfb93083ecea1978492', 0, '0x20ba0e47efc8cdf6a22cc805d7f873168dbd97fc0314d48975782218649b12ce', 614, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xCb1665105B18e63f2aA7706201f9B1C55BbCA2E6'],
        [formatDateTime('2020-12-24T12:04:26.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x45dC22bB7f12970B60755Df24cC1cF116e7D411a', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c00000000000000000000000045dc22bb7f12970b60755df24cc1cf116e7d411a', '0x32e6f1638941082a9be2c6f505b11d6075cf1abd8580f197f96b84fde34ca0de', 0, '0xc838b383799aaa649e755c87e89f3eb6b56f8177dc3e3901fad4e2318675ce25', 613, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x45dC22bB7f12970B60755Df24cC1cF116e7D411a'],
        [formatDateTime('2020-12-24T12:04:11.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x4f64c5f4e212666FFdeB121A851236C2aDe2696f', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000004f64c5f4e212666ffdeb121a851236c2ade2696f', '0x47f8755e272f8c36440673de10a9270bf5a2c8648d531f958b4b02d7ade849b3', 0, '0xbd7ca888bb90a86e8bca781d62a4ab82b3c8fc9b14cca4dfbabd7b295365fb10', 612, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x4f64c5f4e212666FFdeB121A851236C2aDe2696f'],
        [formatDateTime('2020-12-24T12:04:02.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x07a8424c5fA8D68535a8dCc26d405AD12cAe32Bb', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c00000000000000000000000007a8424c5fa8d68535a8dcc26d405ad12cae32bb', '0xc8353465c89464517ab755e3b8aed69be9b41b58b8e8b1e84e6cffac07a92577', 0, '0xc6b181662bf8376d30a5de4402cb7d81e4866b24034b0a201a8c75dc804b0073', 611, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x07a8424c5fA8D68535a8dCc26d405AD12cAe32Bb'],
        [formatDateTime('2020-12-24T12:03:51.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xcEc565ED72acafe7e510d78162C200F9FE3fCe01', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000cec565ed72acafe7e510d78162c200f9fe3fce01', '0x205bf07a9a3c04bb51e8e1462dc0293024768e524bd2c0b273b9acd66953cc7f', 0, '0xf48e1f74bc84d8632146ba2cca933bacf9e498942ef77718f09a7eb7c325dcf9', 610, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xcEc565ED72acafe7e510d78162C200F9FE3fCe01'],
        [formatDateTime('2020-12-24T12:03:40.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x04368aEbc6605052895b1110025C9C23683a5c0e', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c00000000000000000000000004368aebc6605052895b1110025c9c23683a5c0e', '0xfad9f4154d46845f50280849a6eee33ec9c821a679dbd7fba7dea3821659d11a', 0, '0xa82dfe1d20c72dca091968c0941dac296147ab92d7272db98a96f2e985d74184', 609, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x04368aEbc6605052895b1110025C9C23683a5c0e'],
        [formatDateTime('2020-12-24T12:03:31.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x463cf2cA815e30298574Ae910A52B40c9704E3C9', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000463cf2ca815e30298574ae910a52b40c9704e3c9', '0xfffc668b5acc8d8110cc5e1e6d6e53815dae315a741f11b9e07279e54524bd7f', 0, '0x9ce46f5cdd78984b04875c341007238dafba6a737ceca0e248e3dfb3155cef5b', 608, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x463cf2cA815e30298574Ae910A52B40c9704E3C9'],
        [formatDateTime('2020-12-24T12:03:21.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xc6BD6FcD4E7395Da84D31BE87af20DC7A389109c', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000c6bd6fcd4e7395da84d31be87af20dc7a389109c', '0xf6521c1a8b4cc72d6131098e0dac5c6bd77f38c3df6d4c731a7a0310e5ecdcd0', 0, '0x98513a7d26a5a9cb74551681575cdd2fbcf0de945d0d5d77e6300aba3f8ac9e6', 607, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xc6BD6FcD4E7395Da84D31BE87af20DC7A389109c'],
        [formatDateTime('2020-12-24T12:03:11.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0xB54599080AfB3342660a907193087783857B3A3A', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c000000000000000000000000b54599080afb3342660a907193087783857b3a3a', '0xa379439f59bb7b38e23ce706f454054ea7609f7e8ab8ba10b9fdef623c5cb56c', 0, '0x200f5d3afb1f9cb579e2697dc83a1d490bd7aa9c83a43af59bae9debc878af72', 606, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0xB54599080AfB3342660a907193087783857B3A3A'],
        [formatDateTime('2020-12-24T12:03:03.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x5D0af8790F21375C65A75C3822d75fEe75BfC649', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000005d0af8790f21375c65a75c3822d75fee75bfc649', '0xf9fca50abac64b8169792828fcc8c844f86e1d6e9c69e50c1839dae5fc658b1c', 0, '0xdb1d418e0825a287b5de2a865ca6267da91f9293a3ffb31ef453d0cfe3534461', 605, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x5D0af8790F21375C65A75C3822d75fEe75BfC649'],
        [formatDateTime('2020-12-24T12:02:54.000Z'), 'LogSent', 'LogSent(address receiver,uint256) amount', '0x3F37278403BF4Fa7c2B8fa0D21Af353c554641A1', 1000000000000000000, 0, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', '0x005080F78567F8001115F1eee835DD0151BEA476', '0x3e58c58c0000000000000000000000003f37278403bf4fa7c2b8fa0d21af353c554641a1', '0x54e0c6ddc4b3992a70bc08a2187a78866eb2c08eb549b99abc4f2bb8fb367653', 0, '0x0885604ce70cc60ecd570aa152a07e6598e572efdbdc4efaddbe848a1c210570', 604, 'multibaasfaucet', '0xe9f2E2B0105B683b436Fd0d7A2895BE25c310Af7', 'MultiBaasFaucet', 'send', 'send(address) receiver', '0x3F37278403BF4Fa7c2B8fa0D21Af353c554641A1'],
      ],
    },
    {
      name: 'TestMBFUNCTIONLIST',
      skip: false,
      only: false,
      debug: false,
      func: MBFUNCTIONLIST,
      isTemplate: false,
      args: ['erc20interface'],
      expected: [
        ['function', 'description', 'read/write', 'inputs', 'outputs'],
        ['allowance', '', 'read', '2 inputs:\ntokenOwner address\nspender address', '1 output:\nremaining uint256'],
        ['approve', '', 'write', '2 inputs:\nspender address\ntokens uint256', '1 output:\nsuccess bool'],
        ['balanceOf', '', 'read', '1 input:\ntokenOwner address', '1 output:\nbalance uint256'],
        ['decimals', '', 'read', 'no inputs', '1 output:\nuint8'],
        ['name', '', 'read', 'no inputs', '1 output:\nstring'],
        ['symbol', '', 'read', 'no inputs', '1 output:\nstring'],
        ['totalSupply', '', 'read', 'no inputs', '1 output:\nuint256'],
        ['transfer', '', 'write', '2 inputs:\nto address\ntokens uint256', '1 output:\nsuccess bool'],
        ['transferFrom', '', 'write', '3 inputs:\nfrom address\nto address\ntokens uint256', '1 output:\nsuccess bool'],
      ],
    },
    {
      name: 'TestMBGET',
      skip: false,
      only: false,
      debug: false,
      func: MBGET,
      isTemplate: false,
      args: ['privatefaucet', 'multibaasfaucet', 'getOperator'],
      expected: '0x005080F78567F8001115F1eee835DD0151BEA476',
    },
    {
      name: 'TestMBPOSTTEMPLATE',
      skip: false,
      only: false,
      debug: false,
      func: MBPOSTTEMPLATE,
      isTemplate: true,
      args: [2],
      expected: [['address', 'contract', 'method', 'from', 'signer', 'input0', 'input1', 'txHash (output)']],
    },
    {
      name: 'TestMBQUERY with no data',
      skip: false,
      only: false,
      debug: false,
      func: MBQUERY,
      args: ['PrivateFaucetLogSent', 0, 100000],
      expected: [],
    },
    {
      name: 'TestMBQUERY without limit (default is 10) and offset (default is 0)',
      skip: false,
      only: false,
      debug: false,
      func: MBQUERY,
      args: ['PrivateFaucetLogSent'],
      expected: [
        ['amount', 'receiver'],
        [1000000000000000000, '0x672b39f0d2609a6fec23358f4b8d8c92104baf56'],
        [1000000000000000000, '0x3f37278403bf4fa7c2b8fa0d21af353c554641a1'],
        [1000000000000000000, '0x5d0af8790f21375c65a75c3822d75fee75bfc649'],
        [1000000000000000000, '0xb54599080afb3342660a907193087783857b3a3a'],
        [1000000000000000000, '0xc6bd6fcd4e7395da84d31be87af20dc7a389109c'],
        [1000000000000000000, '0x463cf2ca815e30298574ae910a52b40c9704e3c9'],
        [1000000000000000000, '0x04368aebc6605052895b1110025c9c23683a5c0e'],
        [1000000000000000000, '0xcec565ed72acafe7e510d78162c200f9fe3fce01'],
        [1000000000000000000, '0x07a8424c5fa8d68535a8dcc26d405ad12cae32bb'],
        [1000000000000000000, '0x4f64c5f4e212666ffdeb121a851236c2ade2696f'],
      ],
    },
    {
      name: 'TestMBQUERY with limit 5 and offset 3',
      skip: false,
      only: false,
      debug: false,
      func: MBQUERY,
      args: ['PrivateFaucetLogSent', 5, 3],
      expected: [
        ['amount', 'receiver'],
        [1000000000000000000, '0xb54599080afb3342660a907193087783857b3a3a'],
        [1000000000000000000, '0xc6bd6fcd4e7395da84d31be87af20dc7a389109c'],
        [1000000000000000000, '0x463cf2ca815e30298574ae910a52b40c9704e3c9'],
        [1000000000000000000, '0x04368aebc6605052895b1110025c9c23683a5c0e'],
        [1000000000000000000, '0xcec565ed72acafe7e510d78162c200f9fe3fce01'],
      ],
    },
    {
      name: 'TestMBQUERY with limit 32 and offset 0',
      skip: false,
      only: false,
      debug: false,
      func: MBQUERY,
      args: ['PrivateFaucetLogSent', 32, 0],
      expected: [
        ['amount', 'receiver'],
        [1000000000000000000, '0x672b39f0d2609a6fec23358f4b8d8c92104baf56'],
        [1000000000000000000, '0x3f37278403bf4fa7c2b8fa0d21af353c554641a1'],
        [1000000000000000000, '0x5d0af8790f21375c65a75c3822d75fee75bfc649'],
        [1000000000000000000, '0xb54599080afb3342660a907193087783857b3a3a'],
        [1000000000000000000, '0xc6bd6fcd4e7395da84d31be87af20dc7a389109c'],
        [1000000000000000000, '0x463cf2ca815e30298574ae910a52b40c9704e3c9'],
        [1000000000000000000, '0x04368aebc6605052895b1110025c9c23683a5c0e'],
        [1000000000000000000, '0xcec565ed72acafe7e510d78162c200f9fe3fce01'],
        [1000000000000000000, '0x07a8424c5fa8d68535a8dcc26d405ad12cae32bb'],
        [1000000000000000000, '0x4f64c5f4e212666ffdeb121a851236c2ade2696f'],
        [1000000000000000000, '0x45dc22bb7f12970b60755df24cc1cf116e7d411a'],
        [1000000000000000000, '0xcb1665105b18e63f2aa7706201f9b1c55bbca2e6'],
        [1000000000000000000, '0xd05b9736cb99797b74a703a7c12e793bb4f821c4'],
        [1000000000000000000, '0x735d5cc2607044f17dd58610dbfb9799db0cb8b7'],
        [1000000000000000000, '0x46c52492cee185d03953d559db44f5acc822ce57'],
        [1000000000000000000, '0x02cf9cff7adae5c4287c453510666c6ef39257dc'],
        [1000000000000000000, '0x6b2a5a525a34ab5d61ba923c8c87bf4f161b9eae'],
        [1000000000000000000, '0x1ff3a8cdac56e66173e4e71a36c33525be6b31ec'],
        [1000000000000000000, '0xba7b348a5efa84b8dd4b837bae05b89a1da39c12'],
        [1000000000000000000, '0xd8981f7df510f5e6b81bafe402188611e158bf5c'],
        [1000000000000000000, '0x20f0f7d93d451b650a45207d67e5b7ba29684dd4'],
        [1000000000000000000, '0xf78dbe4b5ad7449c5e90a67f769e80d5efe5cef2'],
        [1000000000000000000, '0x80db50d26d67d6d2eb860f89b2e00e64cc4d4cf8'],
        [1000000000000000000, '0x621f1722dcb7fff551d0aa19c54559fbd3bd49c7'],
        [1000000000000000000, '0xdcd5c8b12183fc29091c071ea0b785648c280d18'],
        [1000000000000000000, '0x31c26fd17d164f65485cc122d4a7d169273e6513'],
        [1000000000000000000, '0x6ff08e74456273408c52910ad1ffd3aa1acf4296'],
        [1000000000000000000, '0xf17fe17cd4d879a0c0ae414977337e996e73e787'],
        [1000000000000000000, '0x042fa85cb1cc3cce6d96cabd89c92c0f0e5816b8'],
        [1000000000000000000, '0x0669d51850297024791cf17fe0b9c4587537f0a1'],
        [1000000000000000000, '0x887ff03567c6007451c8326efa7665ccfe2f75e1'],
        [1000000000000000000, '0x0522e43a549d45bc6eaacb0cef9af0925f122b3e'],
      ],
    },
    {
      name: 'TestMBQUERY with limit -1 (infinity) and offset 0',
      skip: false,
      only: false,
      debug: false,
      func: MBQUERY,
      args: ['PrivateFaucetLogSent', -1, 0],
      expected: [
        ['amount', 'receiver'],
        [1000000000000000000, '0x672b39f0d2609a6fec23358f4b8d8c92104baf56'],
        [1000000000000000000, '0x3f37278403bf4fa7c2b8fa0d21af353c554641a1'],
        [1000000000000000000, '0x5d0af8790f21375c65a75c3822d75fee75bfc649'],
        [1000000000000000000, '0xb54599080afb3342660a907193087783857b3a3a'],
        [1000000000000000000, '0xc6bd6fcd4e7395da84d31be87af20dc7a389109c'],
        [1000000000000000000, '0x463cf2ca815e30298574ae910a52b40c9704e3c9'],
        [1000000000000000000, '0x04368aebc6605052895b1110025c9c23683a5c0e'],
        [1000000000000000000, '0xcec565ed72acafe7e510d78162c200f9fe3fce01'],
        [1000000000000000000, '0x07a8424c5fa8d68535a8dcc26d405ad12cae32bb'],
        [1000000000000000000, '0x4f64c5f4e212666ffdeb121a851236c2ade2696f'],
        [1000000000000000000, '0x45dc22bb7f12970b60755df24cc1cf116e7d411a'],
        [1000000000000000000, '0xcb1665105b18e63f2aa7706201f9b1c55bbca2e6'],
        [1000000000000000000, '0xd05b9736cb99797b74a703a7c12e793bb4f821c4'],
        [1000000000000000000, '0x735d5cc2607044f17dd58610dbfb9799db0cb8b7'],
        [1000000000000000000, '0x46c52492cee185d03953d559db44f5acc822ce57'],
        [1000000000000000000, '0x02cf9cff7adae5c4287c453510666c6ef39257dc'],
        [1000000000000000000, '0x6b2a5a525a34ab5d61ba923c8c87bf4f161b9eae'],
        [1000000000000000000, '0x1ff3a8cdac56e66173e4e71a36c33525be6b31ec'],
        [1000000000000000000, '0xba7b348a5efa84b8dd4b837bae05b89a1da39c12'],
        [1000000000000000000, '0xd8981f7df510f5e6b81bafe402188611e158bf5c'],
        [1000000000000000000, '0x20f0f7d93d451b650a45207d67e5b7ba29684dd4'],
        [1000000000000000000, '0xf78dbe4b5ad7449c5e90a67f769e80d5efe5cef2'],
        [1000000000000000000, '0x80db50d26d67d6d2eb860f89b2e00e64cc4d4cf8'],
        [1000000000000000000, '0x621f1722dcb7fff551d0aa19c54559fbd3bd49c7'],
        [1000000000000000000, '0xdcd5c8b12183fc29091c071ea0b785648c280d18'],
        [1000000000000000000, '0x31c26fd17d164f65485cc122d4a7d169273e6513'],
        [1000000000000000000, '0x6ff08e74456273408c52910ad1ffd3aa1acf4296'],
        [1000000000000000000, '0xf17fe17cd4d879a0c0ae414977337e996e73e787'],
        [1000000000000000000, '0x042fa85cb1cc3cce6d96cabd89c92c0f0e5816b8'],
        [1000000000000000000, '0x0669d51850297024791cf17fe0b9c4587537f0a1'],
        [1000000000000000000, '0x887ff03567c6007451c8326efa7665ccfe2f75e1'],
        [1000000000000000000, '0x0522e43a549d45bc6eaacb0cef9af0925f122b3e'],
        [1000000000000000000, '0x6bcc247390b94645f503ad3fc10778850ccfad60'],
        [1000000000000000000, '0x3886b402d099baf00327b688ee0cbfbfd62c2a43'],
        [1000000000000000000, '0xa5e05879388cf0ae4397903c8b0932e4cc692c0c'],
        [1000000000000000000, '0xe7b8fa23e18bf155834fb9e7abf580102d8df788'],
        [1000000000000000000, '0xbf95768d6f4cff0f6f8c6cb2898104141164cf0f'],
        [1000000000000000000, '0x083ca7991089b6ba225ce5c7ac1182194fecd802'],
        [1000000000000000000, '0xa3a365e5319c4c17115d4ce41f2a2a280c99a545'],
        [1000000000000000000, '0x672b39f0d2609a6fec23358f4b8d8c92104baf56'],
        [1000000000000000000, '0x3f37278403bf4fa7c2b8fa0d21af353c554641a1'],
      ],
    },
    {
      name: 'TestMBTX',
      skip: false,
      only: false,
      debug: false,
      func: MBTX,
      args: ['0xfe9e4b800d14c36f2e8c26ab44ffcfcbf55ac71d6f0d5f2ac95b3d63c7f71569'],
      expected: [
        [
          'isPending',
          'nonce',
          'gasPrice',
          'gas',
          'to',
          'value',
          'input',
          'v',
          'r',
          's',
          'hash',
        ],
        [
          false,
          42,
          20000000000,
          22774,
          '0xe9f2e2b0105b683b436fd0d7a2895be25c310af7',
          // TODO: Fix tx value format issue in a spreadsheet
          // https://github.com/curvegrid/multibaas-for-google-sheets/issues/15
          formatDateTime('1E+18'),
          '0xd0e30db0',
          '0xf0742a46',
          '0xf7d63ad5985bfcc8f1764198a32d7e1800e852b2408068b0904187c3e3b3c4dc',
          '0x290fae6d05ef9007ce21f8144629edbd7ebf23a1205a3b4a74a3746c6737132c',
          '0xfe9e4b800d14c36f2e8c26ab44ffcfcbf55ac71d6f0d5f2ac95b3d63c7f71569',
        ],
      ],
    },
  ];

  // TODO: cover internal functions
  // https://github.com/curvegrid/multibaas-for-google-sheets/issues/5

  let testCasesFiltered = testCases.filter((testCase) => testCase.only);
  if (testCasesFiltered.length < 1) {
    testCasesFiltered = testCases;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const testCase of testCasesFiltered) {
    run(test, config, testCase);
  }

  test.finish();

  return { failures: test.totalFailed(), log: loggerAPI() };
}
