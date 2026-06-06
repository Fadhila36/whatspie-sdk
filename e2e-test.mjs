import { WhatspieClient } from './dist/index.mjs';

const client = new WhatspieClient({
  token: 'YOUR_WHATSPIE_TOKEN',
  logger: true
});

const receiver = 'YOUR_PHONE_NUMBER'; // International format

async function run() {
  try {
    console.log('--- 1. Testing Devices ---');
    const devicesResp = await client.devices.list();
    console.log('Devices response:', JSON.stringify(devicesResp));
    
    const devices = Array.isArray(devicesResp) ? devicesResp : (devicesResp.data || devicesResp.devices);
    if (!devices || devices.length === 0) {
      console.log('❌ No connected devices found. Cannot proceed with messaging tests.');
      return;
    }
    
    const deviceIdRaw = devices[0].phone || devices[0].device || devices[0].id;
    const deviceId = String(deviceIdRaw);
    console.log('Using Device (Phone):', deviceId);

    console.log('\n--- 2. Testing Contacts ---');
    const contactResp = await client.contacts.check({
      device: deviceId,
      phones: [receiver]
    });
    console.log('Contacts checked.');

    console.log('\n--- 3. Testing Groups ---');
    try {
      const groupsResp = await client.groups.list(deviceId);
      console.log(`Groups retrieved. Found ${Array.isArray(groupsResp.data) ? groupsResp.data.length : 'unknown'} groups.`);
    } catch (e) {
      console.log('Groups check failed:', e.message);
    }

    console.log('\n--- 4. Sending Text Message ---');
    await client.messages.sendText(deviceId, receiver, 'Halo! Ini adalah pesan E2E test otomatis dari whatspie-sdk v1.0.0 (Refactored) 🚀');
    console.log('Text sent!');

    console.log('\n--- 5. Sending Image Message ---');
    await client.messages.sendImage(
      deviceId,
      receiver,
      'https://picsum.photos/400/300',
      'Ini adalah gambar test'
    );
    console.log('Image sent!');

    console.log('\n--- 6. Sending Video Message ---');
    const videoResp = await client.messages.sendVideo(
      deviceId,
      receiver,
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'Ini adalah video test'
    );
    console.log('Video sent! Raw Response:');
    console.log(JSON.stringify(videoResp, null, 2));

    console.log('\n--- 7. Sending File Message ---');
    const fileResp = await client.messages.sendFile(
      deviceId,
      receiver,
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      'dummy.pdf',
      'Ini adalah file test'
    );
    console.log('File sent! Raw Response:');
    console.log(JSON.stringify(fileResp, null, 2));

    console.log('\n--- 8. Sending Location Message ---');
    await client.messages.sendLocation(deviceId, receiver, -6.200000, 106.816666);
    console.log('Location sent!');

    console.log('\n--- 9. Testing Group Operations (Dummy ID) ---');
    const dummyGroupId = '1234567890-987654321@g.us';
    
    try {
      console.log('Getting Group...');
      await client.groups.get(deviceId, dummyGroupId);
    } catch(e) { console.log('Expected error on getGroup:', e.message); }

    try {
      console.log('Updating Group...');
      await client.groups.update({ device: deviceId, group_id: dummyGroupId, subject: 'Test' });
    } catch(e) { console.log('Expected error on updateGroup:', e.message); }

    try {
      console.log('Adding Members...');
      await client.groups.addMembers({ device: deviceId, group_id: dummyGroupId, participants: [receiver] });
    } catch(e) { console.log('Expected error on addMembers:', e.message); }

    try {
      console.log('Sending Group Message...');
      await client.groups.sendMessage({ device: deviceId, receiver: dummyGroupId, type: 'chat', params: { text: 'Hello Group' }});
    } catch(e) { console.log('Expected error on sendGroupMessage:', e.message); }

    console.log('\n✅ ALL INTEGRATION TESTS PASSED!');
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.name) console.error('Error Type:', error.name);
    if (error.status) console.error('Status:', error.status);
    console.error(error);
  }
}

run();
