import CosmosApp from 'index.js';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import secp256k1 from 'secp256k1/elliptic';
import crypto from 'crypto';

test('get version', async () => {
    const transport = await TransportNodeHid.create(1000);

    const app = new CosmosApp(transport);
    const resp = await app.getVersion();
    console.log(resp);

    expect(resp.return_code).toEqual(0x9000);
    expect(resp.error_message).toEqual('No errors');
    expect(resp).toHaveProperty('test_mode');
    expect(resp).toHaveProperty('major');
    expect(resp).toHaveProperty('minor');
    expect(resp).toHaveProperty('patch');
    expect(resp.test_mode).toEqual(false);
});

test('publicKey', async () => {
    const transport = await TransportNodeHid.create(1000);
    const app = new CosmosApp(transport);

    let path = [44, 118, 0, 0, 0];           // Derivation path. First 3 items are automatically hardened!
    const resp = await app.publicKey(path);

    console.log(resp);

    expect(resp.return_code).toEqual(0x9000);
    expect(resp.error_message).toEqual('No errors');

    expect(resp).toHaveProperty('pk');
    expect(resp).toHaveProperty('compressed_pk');

    expect(resp.pk.length).toEqual(65);
    expect(resp.compressed_pk.length).toEqual(33);

    let expected_compressed_pk = secp256k1.publicKeyConvert(resp.pk, true);
    expect(resp.compressed_pk.toString('hex')).toEqual(expected_compressed_pk.toString('hex'));
});

test('getAddressAndPubKey', async () => {
    jest.setTimeout(60000);

    const transport = await TransportNodeHid.create(1000);
    const app = new CosmosApp(transport);

    let path = [44, 118, 5, 0, 3];           // Derivation path. First 3 items are automatically hardened!
    const resp = await app.getAddressAndPubKey(path, "cosmos");

    console.log(resp);

    expect(resp.return_code).toEqual(0x9000);
    expect(resp.error_message).toEqual('No errors');

    expect(resp).toHaveProperty('bech32_address');
    expect(resp).toHaveProperty('compressed_pk');

    expect(resp.bech32_address).toEqual('cosmos1wkd9tfm5pqvhhaxq77wv9tvjcsazuaykwsld65');
    expect(resp.compressed_pk.length).toEqual(33);
});

test('appInfo', async () => {
    const transport = await TransportNodeHid.create(1000);
    const app = new CosmosApp(transport);

    const resp = await app.appInfo();

    console.log(resp);

    expect(resp.return_code).toEqual(0x9000);
    expect(resp.error_message).toEqual('No errors');

    expect(resp).toHaveProperty('appName');
    expect(resp).toHaveProperty('appVersion');
    expect(resp).toHaveProperty('flagLen');
    expect(resp).toHaveProperty('flagsValue');
    expect(resp).toHaveProperty('flag_recovery');
    expect(resp).toHaveProperty('flag_signed_mcu_code');
    expect(resp).toHaveProperty('flag_onboarded');
    expect(resp).toHaveProperty('flag_pin_validated');
});

test('deviceInfo', async () => {
    const transport = await TransportNodeHid.create(1000);
    const app = new CosmosApp(transport);

    const resp = await app.deviceInfo();

    console.log(resp);

    expect(resp.return_code).toEqual(0x9000);
    expect(resp.error_message).toEqual('No errors');

    expect(resp).toHaveProperty('targetId');
    expect(resp).toHaveProperty('seVersion');
    expect(resp).toHaveProperty('flag');
    expect(resp).toHaveProperty('mcuVersion');
});

test('sign_and_verify', async () => {
    jest.setTimeout(60000);

    const transport = await TransportNodeHid.create(1000);
    const app = new CosmosApp(transport);

    let path = [44, 118, 0, 0, 0];           // Derivation path. First 3 items are automatically hardened!
    let message = '{"account_number":"6571","chain_id":"cosmoshub-2","fee":{"amount":[{"amount":"5000","denom":"uatom"}],"gas":"200000"},"memo":"Delegated with Ledger from union.market","msgs":[{"type":"cosmos-sdk/MsgDelegate","value":{"amount":{"amount":"1000000","denom":"uatom"},"delegator_address":"cosmos102hty0jv2s29lyc4u0tv97z9v298e24t3vwtpl","validator_address":"cosmosvaloper1grgelyng2v6v3t8z87wu3sxgt9m5s03xfytvz7"}}],"sequence":"0"}';

    const response_pk = await app.publicKey(path);
    const response_sign = await app.sign(path, message);

    console.log(response_pk);
    console.log(response_sign);

    expect(response_pk.return_code).toEqual(0x9000);
    expect(response_pk.error_message).toEqual('No errors');
    expect(response_sign.return_code).toEqual(0x9000);
    expect(response_sign.error_message).toEqual('No errors');

    // Check signature is valid
    const hash = crypto.createHash('sha256');
    let msg_hash = hash.update(message).digest();

    let signature_der = response_sign.signature;
    let signature = secp256k1.signatureImport(signature_der);
    let signature_ok = secp256k1.verify(msg_hash, signature, response_pk.compressed_pk);
    expect(signature_ok).toEqual(true);

});

test('sign_big_tx', async () => {
    jest.setTimeout(60000);

    const transport = await TransportNodeHid.create(1000);
    const app = new CosmosApp(transport);

    let path = [44, 118, 0, 0, 0];           // Derivation path. First 3 items are automatically hardened!
    const message = '{"account_number":"108","chain_id":"cosmoshub-2",' +
        '"fee":{"amount":[{"amount":"600","denom":"uatom"}],"gas":"200000"},"memo":"",' +
        '"msgs":[{"type":"cosmos-sdk/MsgWithdrawDelegationReward","value":' +
        '{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper1qwl879nx9t6kef4supyazayf7vjhennyh568ys"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper1x88j7vp2xnw3zec8ur3g4waxycyz7m0mahdv3p"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper1grgelyng2v6v3t8z87wu3sxgt9m5s03xfytvz7"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper1ttfytaf43nkytzp8hkfjfgjc693ky4t3y2n2ku"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper1wdrypwex63geqswmcy5qynv4w3z3dyef2qmyna"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper102ruvpv2srmunfffxavttxnhezln6fnc54at8c"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper10e4vsut6suau8tk9m6dnrm0slgd6npe3jx5xpv"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper1sxx9mszve0gaedz5ld7qdkjkfv8z992ax69k08"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper1ssm0d433seakyak8kcf93yefhknjleeds4y3em"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper13sduv92y3xdhy3rpmhakrc3v7t37e7ps9l0kpv"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper15urq2dtp9qce4fyc85m6upwm9xul3049e02707"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper14kn0kk33szpwus9nh8n87fjel8djx0y070ymmj"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper14lultfckehtszvzw4ehu0apvsr77afvyju5zzy"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper1k9a0cs97vul8w2vwknlfmpez6prv8klv03lv3d"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper1kj0h4kn4z5xvedu2nd9c4a9a559wvpuvu0h6qn"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
        '"value":{"delegator_address":"cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
        '"cosmosvaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpfdn6m9d"}}],"sequence":"106"}';

    const response_pk = await app.publicKey(path);
    const response_sign = await app.sign(path, message);

    console.log(response_pk);
    console.log(response_sign);

    expect(response_pk.return_code).toEqual(0x9000);
    expect(response_pk.error_message).toEqual('No errors');
    expect(response_sign.return_code).toEqual(0x6A80);
    expect(response_sign.error_message).toEqual('NOMEM: JSON string contains too many tokens');
});


test('sign_invalid', async () => {
    jest.setTimeout(60000);

    const transport = await TransportNodeHid.create(1000);
    const app = new CosmosApp(transport);

    let path = [44, 118, 0, 0, 0];           // Derivation path. First 3 items are automatically hardened!
    let invalid_message = `{"chain_id":"local-testnet","fee":{"amount":[],"gas":"500000"},"memo":"","msgs":[{"delegator_addr":"cosmos1qpd4xgtqmxyf9ktjh757nkdfnzpnkamny3cpzv","validator_addr":"cosmosvaloper1zyp0axz2t55lxkmgrvg4vpey2rf4ratcsud07t","value":{"amount":"1","denom":"stake"}}],"sequence":"0"}`;

    const response_sign = await app.sign(path, invalid_message);

    console.log(response_sign);
    expect(response_sign.return_code).toEqual(0x6A80);
    expect(response_sign.error_message).toEqual('JSON Missing account_number');
});
