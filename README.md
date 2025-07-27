# TMAP Coding Test

TMAP API를 활용한 지도 시스템입니다.

## 기능

- **엑셀 Import**: POI 데이터가 저장된 엑셀 파일을 서버에 업로드하여 DB에 저장
- **TMAP API 연동**: TMAP 지도 API를 활용한 지도 표시
- **사용자 위치 추적**: 사용자의 현재 위치를 실시간으로 추적
- **POI 마커 표시**: 업로드된 POI 데이터를 지도에 마커로 표시
- **검색 기능**: POI 이름 또는 주소로 검색 가능
- **지도 중심 이동**: 검색된 마커를 클릭하면 지도 중심으로 이동

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 데이터베이스 실행

```bash
docker-compose up -d
```

### 3. 애플리케이션 실행

```bash
npm start
```

애플리케이션은 `http://localhost:3535`에서 실행됩니다.

## 사용 방법

### 엑셀 파일 업로드

1. 지도 화면에서 "import" 버튼을 클릭합니다.
2. POI 데이터가 포함된 엑셀 파일(.xlsx, .xls)을 선택합니다.
3. 업로드가 완료되면 지도에 POI 마커가 표시됩니다.

### 검색 기능

1. 상단 검색창에 POI 이름이나 주소를 입력합니다.
2. 검색 결과가 지도에 마커로 표시됩니다.
3. 마커를 클릭하면 해당 위치로 지도가 이동합니다.

### 데이터 새로고침

"refresh" 버튼을 클릭하면 데이터베이스에서 최신 POI 데이터를 다시 로드합니다.

## 데이터베이스 스키마

### tb_poi 테이블

| 컬럼명      | 타입          | 설명     |
| ----------- | ------------- | -------- |
| id          | SERIAL        | 기본키   |
| poi_id      | VARCHAR(50)   | POI ID   |
| poi_name    | VARCHAR(200)  | POI 이름 |
| poi_address | TEXT          | POI 주소 |
| poi_lat     | DECIMAL(10,8) | 위도     |
| poi_lng     | DECIMAL(11,8) | 경도     |
| created_at  | TIMESTAMP     | 생성일시 |
| updated_at  | TIMESTAMP     | 수정일시 |

## API 엔드포인트

- `GET /` - 메인 페이지
- `GET /getScript` - TMAP API 키 제공
- `POST /uploadExcel` - 엑셀 파일 업로드
- `GET /api/poi` - POI 데이터 조회
- `GET /api/search?q={검색어}` - POI 검색

## 주의사항

- TMAP API 키는 서버에서 제공되므로 브라우저에 노출되지 않습니다.
- 사용자 위치 추적을 위해 브라우저의 위치 권한이 필요합니다.
- 엑셀 파일 업로드 시 기존 데이터는 모두 삭제되고 새로운 데이터로 교체됩니다.

## 기술 스택

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Frontend**: HTML, CSS, JavaScript
- **Map API**: TMAP API v2
- **File Upload**: Multer
- **Excel Processing**: xlsx
