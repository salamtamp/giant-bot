const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const channelToken =
  'Oc++YkvLhfVHBWr5xFfHMIfrDYfcUTZdwvTlHCCY9Oah8kphfkAw0Ve+VpOpGCbMjjfNsztWmsUTDlY97pFiSP8FcbOD+Y00dsw5qfhppt+21pPGZjEzOvTRK6R4fODv9qBqijYqwluGT37hF9GI+AdB04t89/1O/w1cDnyilFU=';
const baseURL = 'https://api.line.me';
const settings = {
  mongodb: {
    uri: 'mongodb://giantbot:giantbot1234@ds149672.mlab.com:49672/giantbot',
    dbname: 'giantbot',
  },
};

const app = express();
const portNumber = 3010;

const mongoUri = settings.mongodb.uri;

MongoClient.connect(
  mongoUri,
  { useNewUrlParser: true },
  (err, client) => {
    if (err) {
      console.log('err:', err);
      return;
    }
    const db = client.db(settings.mongodb.dbname);

    app.use(cors());
    app.use(bodyParser.json());

    app.post('/', async (req, res) => {
      const { events } = req.body;

      if (events) {
        events.map(async event => {
          const { type, replyToken, message } = event;

          if (message.type === 'text') {
            const text = message.text;
            let result;

            switch (true) {
              case isAddOrder(text):
                result = await addOrder(text, db);
                if (!result.error) {
                  replyMessage('ADD_ORDER', replyToken, result);
                }
                break;
              case isListOrder(text):
                result = await listOrder(text, db);

                console.log('result');
                console.log(result);

                if (!result.error) {
                  replyMessage('LIST_ORDER', replyToken, result);
                }
                break;
              default:
                replyMessage('NO_UNDERSTAND', replyToken);

                replyMessage('HAVE_ERROR', replyToken);
            }
          }
        });
      } else {
        console.log('Error: This message is not events');
      }

      return res.status(200).json({ status: 'ok' });
    });

    app.listen(portNumber, () => {
      console.log(`App started on port: ${portNumber}`);
    });
  },
);

function generateMessage(messageType, data) {
  let messages = [];

  if (messageType === 'ADD_ORDER') {
    messages = [
      {
        type: 'text',
        text: 'ไจแอนท์..เพิ่มรายการเรียบร้อย',
      },
      {
        type: 'text',
        text: `::รายละเอียด::\nกระเป๋าขนาด: ${data.size}\nผู้ส่ง: ${
          data.from
        }\nผู้รับ: ${data.to}\nที่อยู่ผู้รับ: ${data.address}\nประเภทการส่ง: ${
          data.postType
        }\nสถานะ: เข้าระบบ`,
      },
    ];
  } else if (messageType === 'LIST_ORDER') {
    messages = [
      {
        type: 'text',
        text: 'รายการตามด้านล่างนี้จ้า',
      },
      {
        type: 'text',
        text: data.reduce((acc, d) => `${acc}\n- ${d.to}`, ''),
      },
    ];
  } else if (messageType === 'HAVE_ERROR') {
    messages = [
      {
        type: 'text',
        text: 'ไจแอนท์..มีปัญหาบางอย่างใช้งานไม่ได้ แจ้งพี่ปุ้นเร็ววว!!',
      },
    ];
  } else {
    messages = [
      {
        type: 'text',
        text: 'ไจแอนท์..ไม่เข้าใจถามใหม่ได้ปาวค้าบ :)',
      },
    ];
  }

  return messages;
}
function replyMessage(messageType, replyToken, data = {}) {
  const url = `${baseURL}/v2/bot/message/reply`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${channelToken}`,
    },
    data: {
      replyToken: replyToken,
      messages: generateMessage(messageType, data),
    },
    url,
  };

  return axios(options);
}
function isAddOrder(text) {
  const pattern = /add\sorder(\s+)?\\n\w+/;
  const result = JSON.stringify(text).match(new RegExp(pattern, 'i'));
  return result ? true : false;
}
function isListOrder(text) {
  const pattern = /list\sorder(\s+)?([\w\sก-๙]+)/;
  const result = JSON.stringify(text).match(new RegExp(pattern, 'i'));
  return result ? true : false;
}

async function addOrder(text, db) {
  const pattern = /add\sorder(\s+)?\\n(\w+)\s(\w+)\\n([\w\sก-๙]+)\\n([\w\sก-๙]+)\\n\\n([\w\sก-๙]+)\\n([\w\sก-๙]+)\\n([\w\sก-๙\-\/.]+)/;
  const result = JSON.stringify(text).match(new RegExp(pattern, 'i'));

  const formattedData = {
    size: result[3],
    from: result[5],
    to: result[7],
    address: result[8],
    postType: result[2],
    status: 'pickup',
  };

  const response = await db.collection('orders').insertOne(formattedData);

  /* Error */
  if (response.insertedCount !== 1) {
    formattedData.error = true;
  }

  return formattedData;
}
async function listOrder(text, db) {
  const pattern = /list\sorder(\s+)?([\w\sก-๙]+)/;
  const result = JSON.stringify(text).match(new RegExp(pattern, 'i'));
  const filter = {
    status: result[2],
  };

  return await db
    .collection('orders')
    .find(filter)
    .toArray();
}
