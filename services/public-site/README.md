# public-site

`workaround.co.kr` 공개 소개 페이지를 제공하는 정적 서비스다.

## 역할

- `workaround.co.kr` 공개 첫 화면을 제공한다.
- `localhost:7000` 로 보는 내부 통합 프리뷰와 역할을 분리한다.
- reverse proxy 뒤에서 `/health` 와 정적 페이지를 안정적으로 노출한다.

## 기본 실행

```text
cd services/public-site
python app.py
```

기본 포트는 `8010` 이다.

## 환경 변수

- `PORT`: 기본값 `8010`
- `SERVICE_NAME`: 기본값 `public-site`
- `CANONICAL_DOMAIN`: 기본값 `workaround.co.kr`
- `ALIAS_DOMAIN`: 기본값 `workaround.kr`

## 엔드포인트

- `GET /health`
- `GET /`
- `GET /styles.css`
- `GET /site.webmanifest`

## Docker

```text
cd services/public-site
docker build -t workaround-public-site .
docker run --rm -p 8010:8010 workaround-public-site
```
