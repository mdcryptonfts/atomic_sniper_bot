const assetID = '1099600019671'; //The asset you want to buy
const desiredPrice = '110000000'; //The price you want to buy it for, in WAX
const privateKeys = ['YOUR_PRIVATE_KEY_HERE'];
const actor = 'your_wax_address'; //the address that has the authority to make these transactions

const axios = require('axios'); 
const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig'); 
const fetch = require('node-fetch'); 
const { TextDecoder, TextEncoder } = require('util'); 


const signatureProvider = new JsSignatureProvider(privateKeys);
const rpc = new JsonRpc('https://wax.eosdac.io', { fetch }); 
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

async function getSales() {
  const url = "https://wax.api.atomicassets.io/atomicmarket/v2/sales?asset_id=" + assetID + "&page=1&limit=100&order=desc&sort=created";
  let response = await axios.get(url);
  return response.data;
}

getSales().then((data) =>{

Object.keys(data.data).forEach(key => {
console.log('\nI'm working, I'll let you know when I find something.');
const price = data.data[key].listing_price.trim();
console.log("\nPrice: " + price);
const saleID = data.data[key].sale_id;
const symbol = data.data[key].listing_symbol;
const state = data.data[key].state;
const usdPrice = data.data[key].price.amount;
console.log("\nUSD PRICE: " + usdPrice);
const median = data.data[key].price.median;
var usdToPay = usdPrice.slice(0, -8) + "." + usdPrice.slice(-8) + " WAX"; //the amount of wax to deposit for USD sales
console.log("\nUSD TO PAY: " + usdToPay);
let firstUTPChar = usdToPay.charAt(0);
if(firstUTPChar == '.'){usdToPay = '0' + usdToPay};
console.log("\nUSD TO PAY: " + usdToPay);

//Here, if there are any sales, we will check a few things.
//Are they priced in WAX?
//Is that price less than or = what we want to spend?
//Does state = 1? (this means, "is the NFT actually for sale?")

if(symbol == 'WAX' & price <= desiredPrice & state == 1){

var waxToPay = price.slice(0, -8) + "." + price.slice(-8) + " WAX";
let firstChar = waxToPay.charAt(0);
if(firstChar == '.'){waxToPay = '0' + waxToPay};

console.log("\nWAX TO PAY: \n" + waxToPay + "It's a good WAX deal!");

  (async () => {
    try {
      const result = await api.transact({
        actions: [{
            account: 'atomicmarket',
            name: 'assertsale',
            authorization: [{
                actor: actor,
                permission: 'active',
            }],
            data: {
                asset_ids_to_assert: [assetID],
                listing_price_to_assert: waxToPay,
                sale_id: saleID,
                settlement_symbol_to_assert: '8,WAX', 

            },
        },{
            account: 'eosio.token',
            name: 'transfer',
            authorization: [{
                actor: actor,
                permission: 'active',
            }],
            data: {
                 from: actor,
                 memo: 'deposit',
                 quantity: waxToPay,
                 to: 'atomicmarket',

            },
        },{
            account: 'atomicmarket',
            name: 'purchasesale',
            authorization: [{
                actor: actor,
                permission: 'active',
            }],
            data: {
                 buyer: actor,
                 intended_delphi_median: '0',
                 sale_id: saleID,
                 taker_marketplace: '',

            },
        }
        ]
      }, {
        blocksBehind: 3,
        expireSeconds: 90,
      });
       console.log('\n\nIt worked!\n\n');
       

    } catch (e) {
      console.log('\nCaught exception: ' + e);

      if (e instanceof JsonRpc)
        console.log('\n\n' + JSON.stringify(e.json, null, 2));
    }
  })();



} //end if price <= desiredprice

if(symbol == 'WAX' & price > desiredPrice & state == 1){

console.log("\nits a shitty deal!");


} //end if price > desiredprice for WAX based sales


//IF THE SALE IS PRICED IN USD, WE DO ALL THE SAME STUFF BELOW, BUT FOR USD SALES INSTEAD


if(symbol == 'USD' & usdPrice <= desiredPrice & state == 1){

var priceToAssert = price.slice(0, -2) + "." + price.slice(-2) + " USD"; 

let firstUSDChar = priceToAssert.charAt(0);
if(firstUSDChar == '.'){priceToAssert = '0' + priceToAssert};


  (async () => {
    try {
      const result = await api.transact({
        actions: [{
            account: 'atomicmarket',
            name: 'assertsale',
            authorization: [{
                actor: actor,
                permission: 'active',
            }],
            data: {
                asset_ids_to_assert: [assetID],
                listing_price_to_assert: priceToAssert,
                sale_id: saleID,
                settlement_symbol_to_assert: '8,WAX', 

            },
        },{
            account: 'eosio.token',
            name: 'transfer',
            authorization: [{
                actor: actor,
                permission: 'active',
            }],
            data: {
                 from: actor,
                 memo: 'deposit',
                 quantity: usdToPay,
                 to: 'atomicmarket',

            },
        },{
            account: 'atomicmarket',
            name: 'purchasesale',
            authorization: [{
                actor: actor,
                permission: 'active',
            }],
            data: {
                 buyer: actor,
                 intended_delphi_median: median,
                 sale_id: saleID,
                 taker_marketplace: '',

            },
        }
        ]
      }, {
        blocksBehind: 3,
        expireSeconds: 90,
      });
       console.log('\n\nIt worked!\n\n');

    } catch (e) {
      console.log('\nCaught exception: ' + e);

      if (e instanceof JsonRpc)
        console.log('\n\n' + JSON.stringify(e.json, null, 2));
    }
  })();

//END OF ASSERTSALE FUNCTION


} //end if price <= desiredprice

    }); //end object.keys

}); //end .then 
