문서 상태: 작성완료

# 여행 기록 백업 반영

여행 화면의 `내 기록 백업` JSON을 여행 데이터 파일의 `days[].actual`로 옮기는 로컬 절차다. 백업 원문은 개인 기록이므로 저장소에 커밋하지 않는다.

## 1. 폰에서 맥으로 옮기기

1. 폰의 여행 정차역 화면에서 기록을 저장한 뒤 `내 기록 백업`을 누른다.
2. 내려받은 JSON을 파일 앱에 저장하고 AirDrop 또는 iCloud Drive로 맥에 옮긴다.
3. 맥에서 파일명을 `중부유럽-2026-09-18.voyage-backup.json`처럼 바꾼다. 이 확장 이름은 저장소의 `.gitignore`에 포함된다.
4. 파일은 가능하면 저장소 밖의 다운로드 폴더에 둔다. 채팅, 티켓, 히스토리에는 백업 내용이나 사진 데이터를 붙이지 않는다.

## 2. 먼저 변경 예정만 보기

저장소 루트에서 백업 경로를 넘긴다. 기본 실행은 파일을 바꾸지 않는 dry-run이다.

```sh
node frontend/scripts/voyage-import-backup.mjs ~/Downloads/중부유럽-2026-09-18.voyage-backup.json
```

출력은 날짜별 `actual.record`, 식사, 지출, 사진의 개수 변화와 생성될 사진 경로만 보여준다. 메모·식당명·금액 같은 개인 기록 값은 터미널에 출력하지 않는다. 백업의 여행 ID와 데이터 파일이 맞지 않거나 일정에 없는 날짜가 있으면 중단한다.

## 3. 확인 후 실제 반영하기

dry-run의 대상 날짜와 사진 경로가 맞으면 같은 명령에 `--write`를 붙인다.

```sh
node frontend/scripts/voyage-import-backup.mjs ~/Downloads/중부유럽-2026-09-18.voyage-backup.json --write
```

- 현장 백업 값이 같은 정차역의 기존 값보다 우선한다.
- 백업에 대응 항목이 없는 데이터 파일의 식사·지출·사진은 보존한다.
- 사진 data URL은 `frontend/public/voyage/<여행 ID>/<날짜>-<번호>.<확장자>`로 분리되고 데이터에는 공개 경로만 남는다.
- 사진 한 장이 400kB를 넘으면 경고만 한다. 리사이즈는 이 도구가 하지 않는다.
- 데이터 파일에는 날짜별 import 마커가 생긴다. 같은 백업을 다시 실행하면 해당 구간을 갱신하며 중복 구간을 만들지 않는다.

## 4. 결과 검증하기

```sh
node --test frontend/src/data/voyageImport.test.mjs frontend/src/data/voyageCoverage.test.mjs
cd frontend
npm run build -- --base=/workaround.co.kr-platform/
```

그다음 저장소 루트에서 `git diff`로 여행 데이터와 생성된 사진만 포함됐는지 확인한다. 백업 JSON 자체가 추적되지 않았는지도 `git status --short`로 확인한다. PM 검토 전에는 커밋하거나 푸시하지 않는다.

## 실패했을 때

- `지원하지 않는 여행 백업 형식`: 여행 화면의 `내 기록 백업`으로 다시 내려받는다.
- `백업과 일치하는 여행이 없습니다`: 백업의 여행이 아직 `frontend/src/data/voyages/`에 등록되지 않았다.
- `일정에 없는 날짜`: 데이터 파일과 백업의 일정 범위를 먼저 맞춘 뒤 다시 실행한다.
- 사진 크기 경고: 원본을 유지할지 별도 이미지 도구로 줄일지 PM이 결정한다.
