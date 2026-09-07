---
title: OpenAPI 하나로 백엔드 문서화(Swagger UI)와 프론트 API 클라이언트(Orval)까지 연동
date: 2026-09-07
categories: [Dev, API]
tags: [openapi, swagger, springdoc, orval, react-query, typescript]
author: DAN
---

> API가 늘어날수록 "문서 따로, 프론트 타입 따로" 관리가 슬슬 어긋나기 시작합니다.
> OpenAPI 스펙 하나를 단일 계약(single source of truth)으로 두고, 백엔드
> 문서화(Swagger UI)와 프론트 API 클라이언트(Orval) 자동 생성까지 한 줄기로
> 잇는 과정을 정리했습니다.

## TL;DR

- **OpenAPI 스펙**을 단일 계약으로 두면, 문서와 프론트 타입을 손으로 두 번 적지 않아도 됩니다.
- 백엔드는 **springdoc**으로 `/v3/api-docs`(OpenAPI JSON)와 Swagger UI가 자동 생성됩니다.
- 프론트는 **Orval**로 그 스펙에서 TypeScript 타입 + react-query 훅을 자동 생성합니다.
- 핵심은 **커스텀 mutator**로 기존 axios 인증 인터셉터(JWT 주입, 401 refresh)를 그대로 재사용하는 것.
- 실전 함정: Security가 Swagger UI를 막는 문제, `baseURL`의 `/api` 중복, 응답 언랩 누락.

## 목차

1. 배경과 목표
2. 백엔드: springdoc으로 OpenAPI + Swagger UI
3. 프론트엔드: Orval로 타입 + react-query 훅 자동 생성
4. 겪은 이슈 요약
5. 최종 개발 워크플로

> 이 글의 API 이름, 컨트롤러/타입명은 전부 일반화한 예시입니다.
{: .prompt-info }

## 1. 배경과 목표

Spring Boot 3.x / Java 21 백엔드와 React(Vite + TypeScript) 프론트로 구성된
프로젝트를 예로 들겠습니다. API가 늘면서 두 가지 문제가 보였습니다.

- API를 수기로 문서화하거나 프론트 fetch 코드를 손으로 짜면서 **스펙과 구현이 어긋남**
- 요청/응답 타입을 프론트에서 다시 적으며 **타입 중복과 드리프트** 발생

그래서 **OpenAPI 스펙을 단일 계약(single source of truth)** 으로 두고 양방향으로
뻗는 구조를 잡았습니다.

```text
[Spring 컨트롤러/DTO]
        │  springdoc가 런타임에 스펙 생성
        ▼
   /v3/api-docs  (OpenAPI 3 JSON)  ◀── 계약(Contract)
      │                         │
      ▼                         ▼
  Swagger UI                 Orval
 (사람이 확인/테스트)      (프론트 타입 + react-query 훅 자동 생성)
```

핵심 원칙은 하나입니다. **누구도 타입과 엔드포인트를 손으로 두 번 적지 않는다.**

## 2. 백엔드: springdoc으로 OpenAPI + Swagger UI

Spring Boot 3(Jakarta EE 9+)에서는 예전 `springfox`가 호환되지 않으므로
**springdoc-openapi**를 씁니다. 스타터 하나에 OpenAPI 문서 생성기와 Swagger UI가
모두 들어옵니다.

```groovy
// build.gradle
implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0'
```

이 의존성만으로 기본 경로가 열립니다.

- Swagger UI: `/swagger-ui.html` (실제로는 `/swagger-ui/index.html`로 리다이렉트)
- OpenAPI JSON: `/v3/api-docs` (Orval이 소비할 계약)

### 2-1. 문서 메타데이터 + JWT 인증 스킴 등록

JWT Bearer 인증을 쓰는 API라면, Swagger UI에서 토큰을 넣고 호출할 수 있도록
`SecurityScheme`을 등록해 두면 편합니다.

```java
@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI customOpenAPI() {
        SecurityScheme bearerScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization");

        return new OpenAPI()
                .info(new Info()
                        .title("Sample API")
                        .description("샘플 백엔드 API")
                        .version("v1"))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME, bearerScheme))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME));
    }
}
```

두 줄이 핵심입니다.

- `addSecuritySchemes(...)`: "bearerAuth"라는 인증 방식을 **정의**합니다.
- `addSecurityItem(...)`: 이를 **전역 요구사항**으로 걸어 Swagger UI 우측 상단에 **Authorize** 버튼을 만듭니다. 토큰을 한 번 넣으면 이후 모든 요청에 `Authorization: Bearer ...`가 자동으로 붙습니다.

### 2-2. (트러블슈팅) Spring Security가 Swagger UI를 막는 문제

가장 흔하게 걸리는 지점입니다. Security를 STATELESS + JWT로 잠그고
`anyRequest().authenticated()`를 두면, Swagger UI 정적 리소스와 `/v3/api-docs`까지
인증에 막혀 **문서 페이지가 401로 안 열립니다.** 해당 경로를 명시적으로 열어야 합니다.

```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/**").permitAll()
        .requestMatchers("/actuator/health").permitAll()
        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
        .anyRequest().authenticated()
)
```

CSRF는 disable, 세션은 STATELESS로 두었기 때문에 Swagger UI에서 그대로 API를
호출해볼 수 있습니다.

## 3. 프론트엔드: Orval로 타입 + react-query 훅 자동 생성

이제 위에서 만든 `/v3/api-docs`를 프론트가 소비합니다. **Orval**은 OpenAPI 스펙에서
TypeScript 타입과 데이터 패칭 코드를 생성해주는 코드 제너레이터입니다. 여기서는
react-query + axios 조합으로 생성하도록 설정했습니다.

```jsonc
// package.json
"devDependencies": { "orval": "7.13.2" },
"scripts": {
  "gen:api": "orval --config ./orval.config.ts"
}
```

### 3-1. orval.config.ts

```ts
import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: 'http://localhost:8080/v3/api-docs', // 기동 중인 백엔드 스펙
    },
    output: {
      mode: 'tags-split',            // 컨트롤러(tag) 단위로 파일 분리
      target: './src/api/generated',
      schemas: './src/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,                   // 재생성 시 이전 산출물 정리
      override: {
        mutator: {                   // 실제 HTTP는 우리 커스텀 인스턴스로
          path: './src/api/mutator.ts',
          name: 'customInstance',
        },
        query: { useQuery: true, useMutation: true },
      },
    },
  },
});
```

결정 포인트가 두 가지 있었습니다.

- `mode: 'tags-split'`: 백엔드 컨트롤러 태그(auth / user / order / product 등) 기준으로 폴더가 나뉩니다.
- `override.mutator`: **Orval 생성 코드가 우리가 지정한 axios 인스턴스로 호출**하도록 위임합니다. 이번 작업의 가장 중요한 부분입니다(3-2).

생성 결과는 태그별로 정리됩니다.

```text
src/api/generated/
├─ auth-controller/auth-controller.ts
├─ user-controller/user-controller.ts
├─ order-controller/order-controller.ts
├─ product-controller/product-controller.ts
└─ model/            # DTO 타입 (CreateOrderRequest 등)
```

### 3-2. (핵심) 커스텀 mutator로 기존 인증 인터셉터 재사용

생성 코드가 자체 axios로 호출하면 JWT 주입과 401 자동 refresh가 빠집니다. 그래서
기존 수기 클라이언트와 **동일한 인터셉터를 공유**하도록 mutator를 지정했습니다.

```ts
// src/api/mutator.ts
import type { AxiosRequestConfig } from 'axios';
import { API_ORIGIN, createApiClient } from './client';

const orvalInstance = createApiClient(API_ORIGIN);

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return orvalInstance({ ...config, ...options }).then((res) => res.data as T);
};
```

여기서 두 가지 함정을 정리했습니다.

- **baseURL의 `/api` 중복**: OpenAPI 스펙의 각 path에 이미 `/api/...`가 들어 있습니다. 기존 수기 클라이언트는 `baseURL`에 `/api`를 넣어 쓰므로, Orval 인스턴스에는 **오리진만**(`API_ORIGIN`) 넘겨 `/api/api/...` 중복을 막았습니다.
  ```ts
  export const API_ORIGIN = RAW_BASE.replace(/\/api\/?$/, '');
  ```
- **응답 언랩**: `.then((res) => res.data)`로 본문만 반환해, 생성된 훅의 반환 타입이 axios 응답이 아니라 **DTO 그 자체**가 되도록 했습니다.

인증/refresh는 수기 클라이언트와 공유하는 `createApiClient`가 담당합니다. 요청
인터셉터가 Bearer 토큰을 주입하고, 응답 인터셉터가 401을 만나면 refresh 토큰으로
1회 재발급 후 원 요청을 재시도합니다(전역 단일 비행으로 중복 refresh 방지).

### 3-3. 생성된 코드 사용

컴포넌트/훅에서 생성 함수를 그대로 import해서 씁니다. 타입도 함께 생성돼 별도
정의가 필요 없습니다.

```ts
// src/hooks/queries.ts
import { list, detail } from '../api/generated/order-controller/order-controller';
import { create, cancel } from '../api/generated/order-controller/order-controller';
import type { CreateOrderRequest } from '../api/generated/model/createOrderRequest';
```

## 4. 겪은 이슈 요약

| 구간 | 증상 | 원인 | 해결 |
|------|------|------|------|
| Swagger UI | 문서 페이지 401 | Security가 정적 리소스/`api-docs`까지 인증 요구 | `/swagger-ui/**`, `/v3/api-docs/**` permitAll |
| Swagger 인증 테스트 | 보호 API 호출 불가 | 인증 스킴 미등록 | `SecurityScheme` + `SecurityRequirement` 등록 |
| Orval 호출 | `/api/api/...` 404 | 스펙 path와 baseURL 양쪽에 `/api` | Orval 인스턴스엔 오리진만 전달 |
| Orval 호출 | 인증/refresh 누락 | 생성 코드가 자체 axios 사용 | `override.mutator`로 기존 인스턴스 위임 |
| 반환 타입 | 훅이 AxiosResponse 반환 | 언랩 안 함 | mutator에서 `res.data`만 반환 |

## 5. 최종 개발 워크플로

1. 백엔드에서 컨트롤러/DTO 작성 (검증은 `@Valid` + Jakarta Bean Validation 사용)
2. 백엔드 기동 후 `/v3/api-docs`에 최신 스펙이 자동 반영
3. 프론트에서 `npm run gen:api` 실행 → 타입과 react-query 훅 재생성
4. 컴포넌트는 생성된 함수/타입을 import해서 사용

스펙이 곧 코드가 되므로, API가 바뀌면 프론트 재생성 시 **타입 에러로 즉시
드러납니다.** "문서 따로, 프론트 타입 따로" 관리에서 벗어난 것이 이번 작업의 가장
큰 수확이었습니다.
