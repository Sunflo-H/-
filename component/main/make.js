const SUBWAY_LIST_URL = "https://apis.zigbang.com/property/biglab/subway/all?";
// let ROOM_LIST_URL = `https://apis.zigbang.com/v3/items/ad/${subwayId}?subway_id=${subwayId}&radius=1&sales_type=&deposit_s=0&rent_s=0&floor=1~%7Crooftop%7Csemibase&domain=zigbang&detail=false`;
// let ROOM_INFO_URL = `https://apis.zigbang.com/v2/items/${roomId}`;
const 지하철역리스트 = [
  "중곡역",
  "군자역",
  "어린이대공원역",
  "건대입구역",
  "뚝섬유원지역",
  "구의역",
  "강변역",
  "광나루역",
  "아차산역",
];
// ERR_INSUFFICIENT_RESOURCES

function sleep(ms) {
  const wakeUpTime = Date.now() + ms;
  while (Date.now() < wakeUpTime) {}
}
/**
 * 1. 모든 지하철 id를 받아온다
 *
 * 2. 원하는 지하철역 리스트의 id를 찾는다. (이중 반복문)
 * 2-1 이름이 같다면 찾은것!
 *
 * 3. 지하철 id로 주변 매물 id를 찾는다.
 */

// 역을 검색해서 찾는걸로 할까?
// 지도를 특정값 이상으로는 더 확대, 축소 못하게 해서 data를 제한
// 만약 100개를 넘어가면 더이상 fetch 안하게 하고, 클러스터에는 100 + 로 표시

// 매물 리스트에는 지도를 더 확대해 주세요
function getData() {
  fetch(SUBWAY_LIST_URL)
    .then((response) => response.json())
    .then((subwayData) => {
      for (let i = 0; i < 지하철역리스트.length; i++) {
        for (let j = 0; j < subwayData.length; j++) {
          if (지하철역리스트[i] === subwayData[j].name) {
            let subwayId = subwayData[j].id;
            fetch(
              `https://apis.zigbang.com/v3/items/ad/${subwayId}?subway_id=${subwayId}&radius=1&sales_type=&deposit_s=0&rent_s=0&floor=1~%7Crooftop%7Csemibase&domain=zigbang&detail=false`
            )
              .then((response) => response.json())
              .then((subwayAroundData) => {
                console.log(subwayAroundData);
                for (let k = 0; k < subwayAroundData.list_items.length; k++) {
                  if (subwayAroundData.list_items[k].simple_item) {
                    let roomId =
                      subwayAroundData.list_items[k].simple_item.item_id;
                    if (k > 200) return;
                    fetch(`https://apis.zigbang.com/v2/items/${roomId}`)
                      .then((response) => response.json())
                      .then((roomData) => {
                        console.log(roomData);
                      });
                  }
                }
              });
          }
        }
      }
    });
}

// 원하는 역정보가 하나일때, 모든 역일때
/**
 * 찾고자하는 역의 id가 한개일때 사용하는 fetch 함수
 * @param {*} subwayName
 * @returns 역 id
 */
async function getSubwayInfo(subwayName) {
  let response = await fetch(SUBWAY_LIST_URL);
  let data = await response.json();
  let subway = data.find((subway) => subway.name === subwayName);

  return subway.id;
}

async function getRoomIdList(subwayId) {
  let response = await fetch(
    `https://apis.zigbang.com/v3/items/ad/${subwayId}?subway_id=${subwayId}&radius=1&sales_type=&deposit_s=0&rent_s=0&floor=1~%7Crooftop%7Csemibase&domain=zigbang&detail=false`
  );
  let data = await response.json();

  let roomIdList = data.list_items.map((room) => {
    // 기존 data 배열을 id만 얻을수 있게 재정의하여 새 배열을 만들었다.
    return room.simple_item.item_id;
  });
  return roomIdList;
}

async function getRoomInfo(roomId) {
  let response = await fetch(`https://apis.zigbang.com/v2/items/${roomId}`);
  let data = await response.json();
  return data;
}

async function getDataAsync() {
  let subwayId = await getSubwayInfo("아차산역");
  console.log(subwayId);

  let roomIdList = await getRoomIdList(subwayId);
  console.log(roomIdList);

  // roomIdList.forEach(roomId => {
  //   getRoomInfo(roomId);
  // });
  console.log(await getRoomInfo(roomIdList[10]));
}

getRoomIdList(349);
getRoomInfo(33969684);
getDataAsync();

// let a = await new Promise((resolve) => {
//   resolve("하이");
// });
// console.log(a);
// console.log("하이");

// getDataAsync();
// let subwayIdList = await fetch(SUBWAY_LIST_URL)
//   .then((response) => response.json())
//   .then((data) => data);
// subwayIdList.then((data) => {
//   console.log(data);
// });

// console.log(subwayIdList);
// console.log(await subwayIdList);

// console.log(subwayIdList.then((data) => data));

// let subwayId = subwayIdList[0].id;

// let roomIdList = fetch(
//   `https://apis.zigbang.com/v3/items/ad/${subwayId}?subway_id=${subwayId}&radius=1&sales_type=&deposit_s=0&rent_s=0&floor=1~%7Crooftop%7Csemibase&domain=zigbang&detail=false`
// )
//   .then((response) => response.json())
//   .then((data) => data);
// console.log(roomIdList);

// async function getSubwayId() {
//   fetch(SUBWAY_LIST_URL)
//     .then((response) => response.json())
//     .then((data) => {
//       return data;
//     });
// }

// getSubwayId();
// console.log(getSubwayId);
// console.log(getSubwayId());
// getData();

function getDataAll() {
  fetch(SUBWAY_LIST_URL)
    .then((response) => response.json())
    .then((subwayData) => {
      for (let i = 0; i < subwayData.length; i++) {
        // for (let j = 0; j < subwayData.length; j++) {
        // if (지하철역리스트[i] === subwayData[j].name) {
        let subwayId = subwayData[i].id;
        fetch(
          `https://apis.zigbang.com/v3/items/ad/${subwayId}?subway_id=${subwayId}&radius=1&sales_type=&deposit_s=0&rent_s=0&floor=1~%7Crooftop%7Csemibase&domain=zigbang&detail=false`
        )
          .then((response) => response.json())
          .then((subwayAroundData) => {
            console.log(subwayAroundData);
            for (let k = 0; k < subwayAroundData.list_items.length; k++) {
              if (subwayAroundData.list_items[k].simple_item) {
                let roomId = subwayAroundData.list_items[k].simple_item.item_id;
                if (k > 200) return;
                fetch(`https://apis.zigbang.com/v2/items/${roomId}`)
                  .then((response) => response.json())
                  .then((roomData) => {
                    console.log(roomData);
                  });
              }
            }
          });
        // }
        // }
      }
    });
}
// getDataAll();

// function delay(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// async function getApple() {
//   const response = await fetch(SUBWAY_LIST_URL);
//   const data = await response.json();
//   return data;
//   // return "apple";
// }

// async function getBanana() {
//   return "banana";
// }

// async function pick() {
//   const apple = await getApple();
//   console.log(apple);
//   await delay(1000);

//   const banana = await getBanana();
//   console.log(banana);
//   await delay(1000);

//   return `${apple} + ${banana}`;
// }

// pick().then(console.log);
