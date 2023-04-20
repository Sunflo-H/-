# Project : 땡세권
# Stack
- HTML
- CSS
- JavaScript

# API
- Kakao map API
- kakao search API

# Crawling
- 직방

# 목표
집을 구할 때 주변 세권을 알아볼 수 있는 어플리케이션을 만들고 싶었습니다.
1. 직방에서 매물 정보 가져오기
2. 카카오 지도로 클러스터 구현하기
3. 카카오 검색으로 주변 세권 알아보기

# 기능
1. Zoom Level에 따라 지역, 지하철, 매물 클러스터를 보여줍니다.
2. 여러 필터를 적용하여 원하는 매물을 찾을 수 있습니다.
3. 매물 클러스터를 클릭하여 클러스터에 포함된 매물 정보들을 볼 수 있습니다.
4. 매물들을 보증금 or 면적 순으로 정렬할 수 있습니다.
5. 각 매물 클러스터가 어떤 세권을 형성하는지 확인할 수 있습니다.
6. 그 외의 세권도 검색을 통해 확인해 볼 수 있습니다.


# 스크린샷
## HOME
![image](https://user-images.githubusercontent.com/70611956/233365150-f2ecac82-0d46-48b3-8c98-09a3a2a67896.png)

## 매물 클러스터
![image](https://user-images.githubusercontent.com/70611956/233365326-21aa319f-32ce-4eef-aac8-6c1c3ac54055.png)

## 매물 정보
![image](https://user-images.githubusercontent.com/70611956/233365387-c569cfbb-d71e-4b31-882d-b6d804e83cac.png)

## 필터
![image](https://user-images.githubusercontent.com/70611956/233365521-c94293d1-d2c6-4504-90cf-7966323765fa.png)

## 세권
![image](https://user-images.githubusercontent.com/70611956/233365612-a55c1974-1896-4baa-a2ea-3c6bc6117c7c.png)

# 어려웠던점
## 1. Promise, async/await
promise, async/await 를 사용해 봤습니다. 이론적으로 어떤 역할을 하는지 알았지만 막상 실제로 사용해보니 promise로 만든 함수를 async/await로 바꾸는 것조차 어려웠습니다. 유독 어려웠던 Api가 있습니다. 이 Api는 'getLocation(success,error)' 이렇게 제공이 되어서 location 값을 success의 첫번째 인자로 줍니다. location 값으로 뭔가를 하기 위해서는 이 함수의 success에서 location 값을 다뤄야 했습니다. location 값을 얻는것이 이 앱의 첫번째 과정인데 바로 콜백함수로 써버리면 이후 너무 복잡해질것 같아 location 값을 return 하는 함수를 만들고자 많은 시도끝에 promise의 resolve를 이용해서 값을 return할 수 있었습니다.
## 2. Api의 사용
지도api가 앱에서 원활하게 작동되기까지 적용해야할 것들이 많아 구현에 어려움을 겪었습니다. 예로 Zoom Level이나 드래그로 지도의 위치가 바뀔때마다 다른 종류의 클러스터를 보여야 하고, 보여지는 클러스터의 개수도 달라지기 때문에 이때마다 이벤트를 적용해 모든 클러스터들이 에러 없이 작동해야 했습니다. 
## 3. 동적으로 생성되는 요소들
동적으로 생성되는 요소에 이벤트를 등록해야 하고, 그 요소를 클릭하면 또 동적으로 생성되는 요소가 있고, 이벤트를 등록해야했습니다. 이렇다보니 코드가 복잡해져 리팩토링하는데 어려움을 겪었습니다.
