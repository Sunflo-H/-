/**
 * 1. 역 id를 찾는다. (fetch)
 * 2. 역 id로 주변 원룸을 찾는다.
 * 3. 주변 원룸의 좌표를 찾는다.
 * 4. 내 주변의
 */

const SUBWAY_LIST_URL = "https://apis.zigbang.com/property/biglab/subway/all?";
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
fetch(SUBWAY_LIST_URL)
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    for (let i = 0; i < 지하철역리스트.length; i++) {
      for (let j = 0; j < data.length; j++) {
        if (지하철역리스트[i] === data[j].name) {
          console.log(data[j].id);
          let subwayId = data[j].id;
          fetch(
            `https://apis.zigbang.com/v3/items/ad/${subwayId}?subway_id=${subwayId}&radius=1&sales_type=&deposit_s=0&rent_s=0&floor=1~%7Crooftop%7Csemibase&domain=zigbang&detail=false`
          )
            .then((response) => response.json())
            .then((data) => {
              for (let i = 0; i < data.list_items.length; i++) {
                // 0번째가 agent 정보일 때가 있다. agent일때는 item_id가 없어 이걸 염두하고 하자
                if (data.list_items[i].simple_item) {
                  let roomId = data.list_items[i].simple_item.item_id;
                  console.log(roomId);
                  //   fetch(`https://apis.zigbang.com/v2/items/${roomId}`)
                  //     .then((response) => response.json())
                  //     .then((data) => console.log(data.item.item_id));
                }
              }
              console.log(data.list_items.length);
            });
          break;
        }
      }
    }
    // for (let j = 0; j < data.length; j++) {
    //   let subwayId = data[j].id;
    //   fetch(
    //     //지하철역을 기반으로 주변 매물 id 얻음
    //     `https://apis.zigbang.com/v3/items/ad/${subwayId}?subway_id=${subwayId}&radius=1&sales_type=&deposit_s=0&rent_s=0&floor=1~%7Crooftop%7Csemibase&domain=zigbang&detail=false`
    //   )
    //     .then((response) => response.json())
    //     .then((data) => {
    //       //   console.log(data);
    //       for (let i = 0; i < data.list_items.length; i++) {
    //         // 0번째가 agent 정보일 때가 있다. agent일때는 item_id가 없어 이걸 염두하고 하자
    //         if (data.list_items[i].simple_item) {
    //           //   console.log(data.list_items[i].simple_item.item_id);
    //           let roomId = data.list_items[i].simple_item.item_id;
    //           fetch(`https://apis.zigbang.com/v2/items/${roomId}`)
    //             .then((response) => response.json())
    //             .then((data) => console.log(data));
    //         }
    //       }
    //     });
    // }
  });
