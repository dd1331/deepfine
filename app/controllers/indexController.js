const multer = require("multer");
const XLSX = require("xlsx");
const path = require("path");
const https = require("https");

// Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

exports.index = function (req, res) {
  res.render("index");
};

// 스크립트 제공 (TMAP API 키 숨김)
exports.getScript = function (req, res) {
  const apiKey = "VxOtMgjZGc7kTP50VWRKC62WBf2QRzxeaz2ViIqB";
  const url = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${apiKey}`;

  https
    .get(url, (tmapRes) => {
      res.setHeader("Content-Type", "application/javascript");
      tmapRes.pipe(res);
    })
    .on("error", (e) => {
      console.error(e);
      res.status(500).send("Error fetching TMAP script");
    });
};

// 엑셀 파일 업로드 처리
exports.uploadExcel = function (req, res) {
  upload.single("excelFile")(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "파일이 업로드되지 않았습니다." });
    }

    try {
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      console.log("엑셀 데이터 읽기 완료:", data.length, "행");
      console.log("첫 번째 행 데이터:", data[0]);

      // 기존 POI 데이터 삭제 후 새로운 데이터 삽입
      global.psql.query("DELETE FROM tb_poi", [], function (err, result) {
        if (err) {
          return res
            .status(500)
            .json({ error: "데이터베이스 오류: " + err.message });
        }

        console.log("기존 데이터 삭제 완료");

        // 새로운 POI 데이터 삽입 (실제 엑셀 구조에 맞게 수정)
        let insertQuery =
          "INSERT INTO tb_poi (poi_id, poi_name, poi_address, poi_lat, poi_lng) VALUES ";
        let values = [];
        let params = [];

        data.forEach((row, index) => {
          console.log(`행 ${index + 1}:`, row);
          if (row.title && row.latitude && row.longitude) {
            values.push(
              `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${
                index * 5 + 4
              }, $${index * 5 + 5})`
            );
            params.push(
              `POI_${index + 1}`,
              row.title,
              row.title,
              row.latitude,
              row.longitude
            );
          } else {
            console.log(`행 ${index + 1}에서 필수 필드 누락:`, row);
          }
        });

        if (values.length === 0) {
          return res.status(400).json({
            error: "유효한 POI 데이터가 없습니다.",
            sample_data: data.slice(0, 3),
            total_rows: data.length,
          });
        }

        insertQuery += values.join(", ");

        console.log("삽입할 데이터 수:", values.length);

        global.psql.query(insertQuery, params, function (err, result) {
          if (err) {
            return res
              .status(500)
              .json({ error: "데이터 삽입 오류: " + err.message });
          }

          res.json({
            success: true,
            message: `${data.length}개의 POI 데이터가 성공적으로 업로드되었습니다.`,
            count: data.length,
          });
        });
      });
    } catch (error) {
      console.error("엑셀 파일 처리 오류:", error);
      res.status(500).json({ error: "엑셀 파일 처리 오류: " + error.message });
    }
  });
};

// POI 데이터 조회
exports.getPoiData = function (req, res) {
  global.psql.query("SELECT * FROM tb_poi", [], function (err, result) {
    if (err) {
      return res
        .status(500)
        .json({ error: "데이터베이스 오류: " + err.message });
    }
    res.json({ success: true, data: result.rows });
  });
};

// POI 검색
exports.searchPoi = function (req, res) {
  const searchTerm = req.query.q;
  if (!searchTerm) {
    return res.json({ success: true, data: [] });
  }

  global.psql.query(
    "SELECT * FROM tb_poi WHERE poi_name ILIKE $1 OR poi_address ILIKE $1",
    ["%" + searchTerm + "%"],
    function (err, result) {
      if (err) {
        return res
          .status(500)
          .json({ error: "데이터베이스 오류: " + err.message });
      }
      res.json({ success: true, data: result.rows });
    }
  );
};
