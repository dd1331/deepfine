-- postgres 유저가 없으면 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
        CREATE ROLE postgres LOGIN PASSWORD '1234' SUPERUSER;
    END IF;
END
$$;

-- pgadmin 유저가 없으면 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pgadmin') THEN
        CREATE ROLE pgadmin LOGIN PASSWORD '1234';
    END IF;
END
$$;

-- POI 데이터 테이블 생성
CREATE TABLE IF NOT EXISTS tb_poi (
    id SERIAL PRIMARY KEY,
    poi_id VARCHAR(50) NOT NULL,
    poi_name VARCHAR(200) NOT NULL,
    poi_address TEXT NOT NULL,
    poi_lat DECIMAL(10, 8) NOT NULL,
    poi_lng DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- pgadmin 유저에게 테이블 권한 부여
GRANT ALL PRIVILEGES ON TABLE tb_poi TO pgadmin;
GRANT USAGE, SELECT ON SEQUENCE tb_poi_id_seq TO pgadmin;

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_poi_name ON tb_poi(poi_name);
CREATE INDEX IF NOT EXISTS idx_poi_address ON tb_poi(poi_address);
CREATE INDEX IF NOT EXISTS idx_poi_coordinates ON tb_poi(poi_lat, poi_lng);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_tb_poi_updated_at 
    BEFORE UPDATE ON tb_poi 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 