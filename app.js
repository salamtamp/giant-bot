const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const baseURL = 'https://api.line.me';
const settings = {
  mongodb: {
    uri: 'mongodb://giantbot:giantbot1234@ds149672.mlab.com:49672/giantbot',
    dbname: 'giantbot',
  },
  line: {
    token:
      'Oc++YkvLhfVHBWr5xFfHMIfrDYfcUTZdwvTlHCCY9Oah8kphfkAw0Ve+VpOpGCbMjjfNsztWmsUTDlY97pFiSP8FcbOD+Y00dsw5qfhppt+21pPGZjEzOvTRK6R4fODv9qBqijYqwluGT37hF9GI+AdB04t89/1O/w1cDnyilFU=',
  },
};

const app = express();
const portNumber = 3010;
const { line, mongodb } = settings;
const { token: channelToken } = line;
const { uri: mongoUri } = mongodb;

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

    app.get('/healthcheck', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    app.post('/', async (req, res) => {
      console.log('[Giant Bot][INFO] Receive new message(s)');
      const { events } = req.body;

      console.log(events);

      if (events) {
        events.map(async event => {
          const { type, replyToken, message } = event;

          if (message.type === 'text') {
            let text = message.text;
            let result;

            if (typeof text !== 'string') {
              text = JSON.stringify(text);
            }

            text = cleanText(text);

            console.log(`[Giant Bot][INFO] text: ${text}`);

            switch (true) {
              case isHealthcheck(text):
                console.log('[Giant Bot][INFO] is Healthcheck');

                await replyMessage('STATUS_OK', replyToken);
                break;
              case isTrackingCode(text):
                console.log('[Giant Bot][INFO] is TrackingCode');
                const validateStatus = IsBarcode(text);

                console.log(
                  '[Giant Bot][INFO] Validate Status:',
                  validateStatus,
                );
                if (validateStatus === false) {
                  console.log(
                    '[Giant Bot][INFO] Reply message >> TRACKING_VALID_ERROR',
                  );
                  await replyMessage('TRACKING_VALID_ERROR', replyToken);
                } else {
                  const { data, error } = await checkStatusTrackingCode(text);

                  if (error) {
                    console.log(
                      '[Giant Bot][INFO] Reply message >> TRACKING_NOT_FOUND',
                    );
                    await replyMessage('TRACKING_NOT_FOUND', replyToken);
                  } else {
                    console.log(
                      '[Giant Bot][INFO] Reply message >> TRACKING_RESULT',
                    );
                    await replyMessage('TRACKING_RESULT', replyToken, data);
                  }
                }

                break;
              // case isAddOrder(text):
              //   result = await addOrder(text, db);
              //   if (!result.error) {
              //     await replyMessage('ADD_ORDER', replyToken, result);
              //   }
              //   break;
              // case isListOrder(text):
              //   result = await listOrder(text, db);
              //   if (!result.error) {
              //     await replyMessage('LIST_ORDER', replyToken, result);
              //   }
              //   break;
              default:
                console.log('[Giant Bot][INFO] No match result');
                await replyMessage('NO_UNDERSTAND', replyToken);
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

function cleanText(text) {
  return text.trim();
}

function generateMessage(messageType, data) {
  let messages = [];
  if (messageType === 'STATUS_OK') {
    messages = [
      {
        type: 'text',
        text: 'ไจแอนท์..พร้อมใช้งานครับผม!!',
      },
    ];
  } else if (messageType === 'TRACKING_CHECKING') {
    messages = [
      {
        type: 'text',
        text: 'ไจแอนท์..กำลังเช็คให้นะฮับ',
      },
    ];
  } else if (messageType === 'TRACKING_VALID_ERROR') {
    messages = [
      {
        type: 'text',
        text: 'ไจแอนท์..ว่า Code นี้ไม่ถูกต้องน้าา ลองเช็ครหัสดูฮับ',
      },
    ];
  } else if (messageType === 'TRACKING_NOT_FOUND') {
    messages = [
      {
        type: 'text',
        text: 'ไจแอนท์..หารายละเอียดไม่เจอฮับ!',
      },
    ];
  } else if (messageType === 'TRACKING_RESULT') {
    messages = [
      {
        type: 'text',
        text: data.join('\n\n'),
      },
    ];
  } else if (messageType === 'ADD_ORDER') {
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
async function replyMessage(messageType, replyToken, data = {}) {
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

  return await axios(options);
}

function isHealthcheck(text) {
  const pattern = /healthcheck/;
  const result = text.match(new RegExp(pattern, 'i'));
  return result ? true : false;
}

function isTrackingCode(text) {
  const pattern = /E[A-z]\d{9}TH/;
  const result = text.match(new RegExp(pattern, 'i'));
  return result ? true : false;
}

function isAddOrder(text) {
  const pattern = /add\sorder(\s+)?\\n\w+/;
  const result = text.match(new RegExp(pattern, 'i'));
  return result ? true : false;
}
function isListOrder(text) {
  const pattern = /list\sorder(\s+)?([\w\sก-๙]+)/;
  const result = text.match(new RegExp(pattern, 'i'));
  return result ? true : false;
}

async function checkStatusTrackingCode(trackingCode) {
  const url = `https://us-central1-thailandpost-tracking.cloudfunctions.net/tracking?code=${trackingCode}`;
  let status = {
    error: false,
    data: [],
  };

  try {
    const { data: responseData } = await axios.get(url, {
      timeout: 60000,
    });

    if (responseData) {
      const { data, error } = responseData;

      if (error) {
        status.error = true;
      } else {
        const { tracking_status: trackingStatus } = data;
        status.data = trackingStatus;
      }
    }
  } catch (error) {
    status.error = true;

    console.log('==== ERROR ====');
    console.log(error);
  }

  return status;
}

async function addOrder(text, db) {
  const pattern = /add\sorder(\s+)?\\n(\w+)\s(\w+)\\n([\w\sก-๙]+)\\n([\w\sก-๙]+)\\n\\n([\w\sก-๙]+)\\n([\w\sก-๙]+)\\n([\w\sก-๙\-\/.]+)/;
  const result = text.match(new RegExp(pattern, 'i'));

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
  const result = text.match(new RegExp(pattern, 'i'));
  const filter = {
    status: result[2],
  };

  return await db
    .collection('orders')
    .find(filter)
    .toArray();
}

function IsFilter(strBarCode) {
  if (strBarCode.substring(1, 0).toUpperCase() == 'E') {
    return true;
  } else if (
    strBarCode.substring(2, 0).toUpperCase() == 'CP' &&
    strBarCode.substring(11, 13).toUpperCase() == 'TH'
  ) {
    return true;
  } else if (
    strBarCode.substring(1, 0).toUpperCase() == 'C' &&
    strBarCode.substring(11, 13).toUpperCase() != 'TH'
  ) {
    return true;
  } else if (
    strBarCode.substring(2, 0).toUpperCase() == 'KA' &&
    strBarCode.substring(11, 13).toUpperCase() == 'TH'
  ) {
    return true;
  } else if (strBarCode.substring(1, 0).toUpperCase() == 'R') {
    return true;
  } else if (strBarCode.substring(1, 0).toUpperCase() == 'L') {
    return true;
  } else if (
    strBarCode.length > 1 &&
    strBarCode.substring(2, 0).toUpperCase() == 'DS'
  ) {
    return true;
  } else if (
    strBarCode.length == 13 &&
    strBarCode.substring(1, 0).toUpperCase() == 'V' &&
    strBarCode.substring(11, 13).toUpperCase() != 'TH'
  ) {
    return true;
  } else if (
    strBarCode.length > 1 &&
    strBarCode.substring(2, 0).toUpperCase() == 'PE' &&
    strBarCode.substring(11, 13).toUpperCase() != 'TH'
  ) {
    return true;
  } else if (
    strBarCode.length > 1 &&
    strBarCode.substring(2, 0).toUpperCase() == 'VR' &&
    strBarCode.substring(11, 13).toUpperCase() == 'TH'
  ) {
    return true;
  } else if (
    strBarCode.length > 1 &&
    strBarCode.substring(2, 0).toUpperCase() == 'VS' &&
    strBarCode.substring(11, 13).toUpperCase() == 'TH'
  ) {
    return true;
  } else {
    return false;
  }
}
function IsBarcode(strBarCode) {
  var SumAll;
  var Result;
  if (strBarCode.length < 13) {
    return true;
  }
  if (strBarCode != '') {
    if (strBarCode.length == 13) {
      if (strBarCode.substring(11, 10).toUpperCase() == 'X') {
        if (IsFilter(strBarCode)) {
          return true;
        } else {
          return false;
        }
      }
    } else {
      return true;
    }
    SumAll = 0;
    SumAll = SumAll + parseInt(strBarCode.substring(3, 2)) * 8;
    SumAll = SumAll + parseInt(strBarCode.substring(4, 3)) * 6;
    SumAll = SumAll + parseInt(strBarCode.substring(5, 4)) * 4;
    SumAll = SumAll + parseInt(strBarCode.substring(6, 5)) * 2;
    SumAll = SumAll + parseInt(strBarCode.substring(7, 6)) * 3;
    SumAll = SumAll + parseInt(strBarCode.substring(8, 7)) * 5;
    SumAll = SumAll + parseInt(strBarCode.substring(9, 8)) * 9;
    SumAll = SumAll + parseInt(strBarCode.substring(10, 9)) * 7;
    Result = SumAll % 11;
    if (Result == 0) {
      if (parseInt(strBarCode.substring(11, 10)) == 5) {
        if (IsFilter(strBarCode)) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else if (Result == 1) {
      if (parseInt(strBarCode.substring(11, 10)) == 0) {
        if (IsFilter(strBarCode)) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      if (parseInt(strBarCode.substring(11, 10)) == 11 - Result) {
        if (IsFilter(strBarCode)) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
}
