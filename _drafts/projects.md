---
title: 프로젝트 경력 정리 (초안)
categories: [Career]
tags: [portfolio, cloud, devops]
---

> 나중에 블로그 포스트로 정리하기 위한 프로젝트 경력 초안입니다.
> `_drafts` 폴더에 있어 사이드바 탭이나 정식 포스트로 노출되지 않습니다.

## 핵심 보유 기술

- **Infrastructure & DevOps** : AWS, NHN Cloud, Kubernetes(EKS, NKS), Docker, Jenkins, Gitlab CI/CD
- **Backend** : Java, Spring Boot, Spring Batch, MyBatis
- **Frontend** : JavaScript, Vue.js, Nexacro
- **Database** : Oracle, PostgreSQL, MS-SQL, Redis (NoSQL)

---

# 아시아나IDT

> 클라우드 전환 및 MSA 기반 시스템 구축, 대용량 데이터 처리 중심의 Full-Stack / DevOps 프로젝트를 수행한 시기입니다.

## 인천국제공항 통합정보시스템 고도화

- **기간** : 2025.08 \~ 2026.05
- **역할** : B/E 개발 및 쿼리 튜닝, Nexacro 화면 개발
- **내용** : 공항 A-CDM 모듈 고도화 및 대용량 데이터 처리 성능 개선

**주요 성과**

- **[쿼리 성능 튜닝]** 실행 계획 분석으로 악성 SQL을 식별하고 인덱스 최적화 수행. 주요 조회 쿼리 수행 시간을 **20초에서 0.6초로 단축**하여 시스템 전반의 퍼포먼스 향상.
- **[Legacy Modernization]** Oracle 프로시저 로직을 Java/Spring 애플리케이션 계층으로 이관하여 비즈니스 로직의 유지보수성 증대.

`Java` `Spring Boot` `Nexacro` `Oracle` `SQL Tuning`

---

## 에어인천 그룹웨어 및 모바일 시스템 구축

- **기간** : 2024.12 \~ 2025.07
- **역할** : 모바일 PL, CI/CD 구축, 백엔드 개발
- **내용** : 그룹웨어 신규 구축 및 하이브리드 모바일 앱 개발 리딩

**주요 성과**

- **[DevOps 환경 도입]** Jenkins CI/CD를 구축하여 개발 결과물이 즉시 테스트 서버에 반영되는 프로세스 정립. 개발-QA 피드백 주기 획기적 단축.
- **[하이브리드 앱 아키텍처]** Webview 인터페이스를 설계하여 모바일 서비스 확장성 확보.

`Java` `Spring Boot` `Jenkins` `Webview` `Hybrid App`

---

## Plan2Do 서비스 클라우드 전환 및 MSA 구축

- **기간** : 2024.10 \~ 2024.12
- **역할** : 클라우드 인프라 구축 및 B/E 개발
- **내용** : 온프레미스 환경의 서비스를 NHN Cloud 기반의 MSA 환경으로 전면 전환

**주요 성과**

- **[K8S 클러스터 구축]** NKS(NHN Kubernetes Service) 기반 컨테이너 오케스트레이션 환경 구축. 오토스케일링(HPA) 적용으로 트래픽 변동에 유연한 인프라 확보.
- **[CI/CD 파이프라인 설계]** Gitlab Runner를 도입하여 빌드-테스트-배포 과정을 **100% 자동화**. 기존 수동 배포 대비 **배포 소요 시간 70% 단축** 및 휴먼 에러 제로화 달성.
- **[데이터 마이그레이션]** 이기종 DB 간 데이터 이관 스크립트 작성 및 검증을 통해 데이터 무결성을 보장하며 안정적인 클라우드 이관 완료.

`NHN Cloud` `Kubernetes(NKS)` `Docker` `Gitlab CI/CD` `MSA`

---

## 대교 차세대 드림스 시스템 고도화 (AWS/MSA)

- **기간** : 2023.07 \~ 2024.03
- **역할** : 공통 PL, B/E, F/E 개발
- **내용** : AWS 클라우드 환경에서 MSA 기반 시스템의 공통 모듈 개발 및 대용량 배치 처리 구현

**주요 성과**

- **[배포 자동화]** Jenkins 기반 배포 파이프라인을 구축하고 운영/스테이징 서버의 환경 일관성 유지.
- **[성능 최적화]** Redis 캐시 서버를 도입하여 세션 정보를 관리하고 TTL 기반 인증번호 프로세스 구축, Push 발송 API 응답 속도 대폭 개선.
- **[배치 처리 효율화]** Spring Batch와 Jenkins를 연동하여 대용량 데이터 집계 프로세스를 자동화하고, 실패 시 알림(Alert) 체계를 구축하여 운영 안정성 확보.

`AWS` `MSA` `Spring Batch` `Redis` `Jenkins`

---

## 전북도청 클라우드 컴퓨팅 서비스 전환

- **기간** : 2023.02 \~ 2023.06
- **역할** : 데이터 전환 및 클라우드 마이그레이션 수행
- **내용** : 14개 시·군 270개 공공기관의 정보시스템을 클라우드로 전면 전환하는 프로젝트 참여

**주요 성과**

- **[이기종 DB 전환]** Oracle, MS-SQL 등 다양한 원천 데이터를 오픈소스 DB(PostgreSQL)로 전환하며 스키마 매핑 및 데이터 정합성 검증 수행.

`Oracle` `MS-SQL` `PostgreSQL` `Data Migration` `Cloud`

---

# NPS SYSTEM

> .NET 기반 Windows 프로그램과 하드웨어 연동 자동화 솔루션(조선/제조 현장)을 개발하던 시기의 프로젝트입니다.

## 안드로이드 플랫폼 변경 프로젝트

- **고객사** : 한국알콜산업(KAI) / 이엔에프 테크놀로지(ENF Tech.)
- **기간** : 2022.06 \~ 2022.08
- **내용** : WinCE 플랫폼으로 구현된 프로그램을 Android 플랫폼으로 컨버전
- **역할** : Backend 개발, 유지보수
- Retrofit2를 활용한 HTTP 통신 / WCF를 활용한 API 개발

`Android` `Java` `WCF` `C#` `Microsoft SQL`

---

## 출하 바코드 검증 시스템

- **고객사** : 한국알콜산업(KAI) / 이엔에프 테크놀로지(ENF Tech.)
- **기간** : 2019.06 \~ 2019.09
- **내용** : 출력된 바코드 이상 유무 검증 및 드럼 입고/생산/출하 과정 실적 처리
- **역할** : WinForm, WinCE 프로그램 FE 개발
- Panasonic Scanner SDK 활용 / 이미지 처리를 통한 바코드 이상 유무 확인 / 드럼 입고·생산·출하 실적 관리 WinCE 단말기 프로그램 개발

`C#` `.NET Framework` `WinCE` `Microsoft SQL` `WCF`

---

## 교육대상자 출결 인증 시스템

- **고객사** : 현대중공업
- **기간** : 2022.09 \~ 2022.10
- **내용** : Android/iOS 크로스 플랫폼 개발을 위해 Flutter 사용
- **역할** : 프로그램 설계, FE 개발
- UUID 생성(Android_id/IDFV) / Shared Preference / HTTP

`Android` `iOS` `Flutter` `Kotlin` `Swift` `WCF` `C#`

---

## 백그라운드 GPS 송신 앱

- **고객사** : 현대중공업
- **기간** : 2022.09 \~ 2022.10
- **내용** : Android/iOS 크로스 플랫폼 개발을 위해 Flutter 사용
- **역할** : 프로그램 설계, FE 개발
- UUID 생성(Android_id/IDFV) / Shared Preference / HTTP / geolocator

`Flutter` `Android` `Kotlin` `iOS` `Swift` `WCF` `C#` `ORACLE`

---

## 내업 실적 수집 체계 구축

- **고객사** : 현대중공업
- **기간** : 2021.10 \~ 2022.03
- **내용** : 조선소 내업공정 실적 조회/수집 및 모둠 처리를 위한 키오스크 프로그램 개발
- **역할** : 프로그램 설계, Frontend / Backend 개발
- EPSON 라벨프린터 SDK 활용 / 키오스크 최적화

`C#` `.NET Framework` `DevExpress` `WCF` `ORACLE`

---

## 설계 문서 OCR 프로그램

- **고객사** : 현대중공업
- **기간** : 2022.07 \~ 2022.10
- **내용** : OCR OpenAPI를 활용한 문서 OCR 프로그램 개발
- **역할** : 솔루션 개발
- Panasonic Scanner SDK 활용

`C#` `.NET Framework` `DevExpress` `ORACLE`

---

## 의장/철의장 스마트 배관 작업 관리 시스템 (KIOSK)

- **고객사** : 현대중공업
- **기간** : 2020.04 \~ 2020.06
- **내용** : 조선소 실적 관리를 위한 국가사업 참여
- **역할** : 키오스크 프로그램 FE 개발
- PDF Viewer

`C#` `.NET Framework` `DevExpress`

---

## 내업 실적 수집 체계 구축 (자동화)

- **고객사** : 현대중공업
- **기간** : 2021.10 \~ 2022.03
- **내용** : AR마커를 활용한 조선소 내업공정 실적 수집 자동화 프로그램 개발
- **역할** : 솔루션 개발
- Panasonic Network Camera SDK 활용 / Emgu.CV를 활용한 카메라 화면 연동 및 이미지 전처리 / OpenAPI를 활용한 AR마커 인식

`C#` `.NET Framework` `Emgu.CV` `WCF` `ORACLE`

---

## 고소차 충돌방지 시스템 (PoC)

- **고객사** : 현대중공업
- **기간** : 2021.06 \~ 2021.09
- **내용** : 거리센서를 활용한 고소차 충돌방지 시스템 개발
- **역할** : WinForm 솔루션 개발
- Panasonic Network Camera SDK 활용 / Emgu.CV를 활용한 카메라 화면 연동 / 태블릿 최적화 / MQTT를 활용한 센서 통신

`C#` `.NET Framework` `Emgu.CV` `Microsoft SQL` `WCF`

---

## iTextSharp를 활용한 PDF Parser

- **고객사** : 현대중공업 특수선
- **기간** : 2019.05 \~ 2019.05
- **내용** : iTextSharp OpenAPI를 활용한 PDF 내용 추출 프로그램 개발
- **역할** : 솔루션 개발
- iTextSharp OpenAPI 활용

`C#` `.NET Framework` `iTextSharp`

---

## 2야드 강재 위치 추적 시스템

- **고객사** : 현대중공업
- **기간** : 2020.10 \~ 2021.03
- **내용** : AR마커를 활용한 강재 정보 조회 및 실적 처리 프로그램 개발
- **역할** : 솔루션 개발, DB 연동
- Panasonic Network Camera SDK 활용 / Emgu.CV를 활용한 이미지 전처리 / OpenAPI를 활용한 AR마커 인식

`C#` `.NET Framework` `DevExpress` `ORACLE` `WCF`

---

## 실시간 내업 공정 정보 수집 체계 구축

- **고객사** : 현대삼호중공업
- **기간** : 2019.09 \~ 2020.03
- **내용** : AR마커를 활용한 강재 조회 및 실적 처리 자동화 프로그램 개발
- **역할** : HW 설계, 솔루션 개발, DB 연동
- Panasonic Network Camera SDK 활용 / Emgu.CV를 활용한 이미지 전처리 / OpenAPI를 활용한 AR마커 인식 / '강재 정보 처리 장치 및 그 방법' 특허 출원

`C#` `.NET Framework` `DevExpress` `ORACLE` `WCF`

---

## 지게차 전후방 카메라 시스템 개선

- **고객사** : 현대삼호중공업
- **기간** : 2021.03 \~ 2021.05
- **내용** : 네트워크 카메라를 활용한 지게차 전후방 카메라 시스템 개발
- **역할** : 솔루션 개발
- Panasonic Network Camera SDK 활용 / Emgu.CV를 활용한 카메라 화면 연동 / 태블릿 최적화

`C#` `.NET Framework`

---

## 지게차 충돌방지 시스템 (PoC)

- **고객사** : 현대삼호중공업
- **기간** : 2021.06 \~ 2021.09
- **내용** : 네트워크 카메라와 거리센서를 활용한 지게차 충돌방지 시스템 개발
- **역할** : 솔루션 개발
- Panasonic Scanner SDK 활용 / Emgu.CV를 활용한 카메라 화면 연동 / MQTT를 활용한 센서 연동

`C#` `.NET Framework` `Emgu.CV`
