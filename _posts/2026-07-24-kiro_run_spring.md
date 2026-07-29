---
title: Kiro IDE에서 Spring Boot 프로젝트 실행하기
date: 2026-07-24
tags: [PanOcean, kiro, Spring Boot]
author: DAN
---

# Kiro IDE에서 Spring Boot 프로젝트 실행하기

> Spring Boot 3.5.5 + Java 21 + Gradle 멀티모듈 프로젝트를 Kiro IDE에서 띄우기까지의 실전 기록

## 목차

1. 들어가며
2. 왜 "전역 JDK 설정"을 안 쓰는가
3. 사전 준비물
4. 실행 방법 1 — Kiro 통합 터미널에서 Gradle로 실행
5. 실행 방법 2 — Java 확장의 Run 버튼 사용
6. 실행 방법 3 — Gradle 사이드바에서 실행
7. 기동 확인
8. 자주 만나는 문제
9. 부록 — Kiro 프롬프트 초안
10. 마치며


## 1. 들어가며

VS Code 기반의 AI 개발 환경인 Kiro IDE에서 실제 Spring Boot 프로젝트를 실행해봤습니다. 단순한 `Hello World`가 아니라, 아래 같은 "현실적인" 조건이 붙은 프로젝트라 삽질 포인트가 몇 개 있었는데요. 같은 상황을 겪을 분들을 위해 정리해 둡니다.

이 글에서 다루는 프로젝트의 스펙은 다음과 같습니다.

- Java 21
- Spring Boot 3.5.5
- Gradle (Wrapper 사용)
- MyBatis + Oracle
- 형제 모듈(`common-module`)에 의존하는 멀티모듈 구조
- 실행 시 프로파일(`local`, `dev`, `stg`, `prd`) 지정 필요

## 2. 왜 "전역 JDK 설정"을 안 쓰는가

보통 튜토리얼은 시스템 환경변수 `JAVA_HOME`을 JDK 21로 바꾸라고 합니다. 하지만 개발 PC에는 다른 프로젝트가 쓰는 JDK 8, 11이 함께 깔려 있는 경우가 많습니다. 전역 설정을 바꾸면 다른 프로젝트가 깨지죠.

그래서 이 프로젝트는 **전역 설정을 절대 건드리지 않고, 프로젝트 범위 안에서만 JDK 21을 잡는** 방식을 씁니다. 포인트는 두 개의 파일입니다.

### 2-1. Gradle 데몬용 JDK 지정 (`gradle.properties`)

```properties
# 이 프로젝트 전용 Gradle 데몬 JDK 지정 (전역 JAVA_HOME 미변경)
org.gradle.java.home=D:/tools/jdk-21
```

`org.gradle.java.home` 한 줄로, 이 프로젝트에서 Gradle을 돌릴 때 쓰는 JDK를 고정합니다. Windows 경로라도 백슬래시 이스케이프 이슈를 피하려고 슬래시(`/`)를 씁니다.

### 2-2. Kiro(VS Code) 워크스페이스 설정 (`.vscode/settings.json`)

```json
{
  // 이 워크스페이스의 Kiro 통합 터미널에서만 JDK 21을 사용
  "terminal.integrated.env.windows": {
    "JAVA_HOME": "D:\\tools\\jdk-21",
    "PATH": "D:\\tools\\jdk-21\\bin;${env:PATH}"
  },

  // Java 확장(Red Hat Language Support / Gradle for Java)이 인식하는 JDK
  "java.jdt.ls.java.home": "D:\\tools\\jdk-21",
  "java.import.gradle.java.home": "D:\\tools\\jdk-21",
  "java.configuration.runtimes": [
    { "name": "JavaSE-21", "path": "D:\\tools\\jdk-21", "default": true }
  ]
}
```

여기서 두 가지가 분리돼 있다는 걸 이해하면 좋습니다.

- `terminal.integrated.env.windows`: Kiro 통합 터미널에서 `./gradlew`를 직접 칠 때 쓰는 JDK
- `java.*` 설정들: Java 언어 서버와 Gradle 확장이 코드 분석/실행에 쓰는 JDK

둘 다 잡아줘야 "터미널에선 되는데 IDE 코드 분석은 JDK를 못 찾는" 엇박자가 안 생깁니다.

## 3. 사전 준비물

1. **JDK 21 설치** — 위 설정의 경로(`D:\tools\jdk-21`)에 맞춰 압축을 풀거나 설치합니다. 경로가 다르면 `gradle.properties`와 `.vscode/settings.json`의 경로만 본인 환경에 맞게 수정하면 됩니다.
2. **Java 확장 설치** — Kiro 확장 마켓에서 `Extension Pack for Java`(또는 Red Hat Language Support for Java, Gradle for Java)를 설치합니다.
3. **형제 모듈 배치** — 이 프로젝트는 `common-module` 모듈에 의존합니다. `settings.gradle`이 상위 폴더의 `../common-module`을 찾도록 되어 있으므로, 로컬에서는 아래처럼 두 폴더가 나란히 있어야 합니다.

```
D:\workspace\
├── my-boot-api      <- 지금 이 프로젝트
└── common-module    <- 의존 모듈
```

`settings.gradle`에서 이 부분을 자동 판별합니다.

```groovy
def ciCommon = new File(settingsDir, 'common-module')
def localCommon = new File(settingsDir, '../common-module')
def subProjectDir = ciCommon.exists() ? ciCommon : localCommon
```

즉 CI 환경이면 워크스페이스 내부의 `common-module`을, 로컬이면 형제 폴더를 씁니다.

## 4. 실행 방법 1 — Kiro 통합 터미널에서 Gradle로 실행

가장 확실한 방법입니다. Kiro에서 터미널을 열면(단축키 `` Ctrl+` ``) `.vscode/settings.json` 덕분에 이미 JDK 21이 `PATH`에 잡혀 있습니다.

먼저 JDK가 제대로 잡혔는지 확인합니다.

```powershell
java -version
```

`21`이 찍히면 정상입니다. 이제 애플리케이션을 실행합니다.

```powershell
./gradlew bootRun -Pprofile=local
```

`-Pprofile=local` 인자가 핵심입니다. 이 프로젝트의 `build.gradle`은 프로파일에 따라 의존성 해석 방식이 달라집니다.

```groovy
if ('local' == profile) {
    implementation project(':common-module')            // 소스 모듈로 직접 참조
} else {
    implementation "com.example:common-module:${version}"  // Nexus 아티팩트로 참조
}
```

- `local`: 형제 폴더의 `common-module`을 소스째로 빌드해 참조 (개발용)
- `dev` / `stg` / `prd`: Nexus 저장소에서 배포된 아티팩트를 내려받아 참조

`bootRun`에는 인코딩 관련 JVM 옵션도 미리 걸려 있어서, 한글 로그가 깨지지 않습니다.

```groovy
bootRun {
    jvmArgs = ['-Dfile.encoding=UTF-8', '-Dconsole.encoding=UTF-8', ...]
}
```

정상 기동되면 기본 포트 **8000**에서 뜹니다. `application.yml`에서 확인할 수 있습니다.

```yaml
server:
  port: ${G_PORT:8000}
```

`G_PORT` 환경변수가 있으면 그 값을, 없으면 8000을 씁니다.

## 5. 실행 방법 2 — Java 확장의 Run 버튼 사용

Java 확장을 설치하면, 메인 클래스 위에 `Run | Debug` 코드 렌즈가 뜹니다.

```java
@SpringBootApplication(exclude = {
    SecurityAutoConfiguration.class,
    RedisAutoConfiguration.class,
    ManagementWebSecurityAutoConfiguration.class
})
@ComponentScan({"com.example.api", "com.example.module"})
@MapperScan(basePackages = {"com.example.api.app.mapper", "com.example.module.app.mapper"})
public class MyApiApplication extends SpringBootServletInitializer {
    public static void main(String[] args) {
        SpringApplication.run(MyApiApplication.class, args);
    }
}
```

`main()` 위의 `Run`을 누르면 바로 실행됩니다. 다만 이 방식은 기본적으로 프로파일 인자 없이 뜨는데, 이 프로젝트는 `application.yml`에 기본 프로파일이 `local`로 지정돼 있어서 그대로도 동작합니다.

```yaml
spring:
  profiles:
    active:
    - local
```

프로파일이나 VM 옵션을 바꿔 실행하고 싶다면 `.vscode/launch.json`에 실행 구성을 추가하면 됩니다.

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "MyApiApplication (local)",
      "request": "launch",
      "mainClass": "com.example.api.MyApiApplication",
      "projectName": "my-boot-api",
      "args": "--spring.profiles.active=local",
      "vmArgs": "-Dfile.encoding=UTF-8"
    }
  ]
}
```

> 참고: 터미널 `-Pprofile=local`(Gradle 프로퍼티)과 `--spring.profiles.active=local`(Spring 프로파일)은 성격이 다릅니다. 전자는 "빌드 시 의존성 해석"에, 후자는 "런타임 설정 파일 선택"에 영향을 줍니다. 로컬 개발에선 둘 다 `local`로 맞춰두면 헷갈릴 일이 없습니다.

## 6. 실행 방법 3 — Gradle 사이드바에서 실행

`Extension Pack for Java`를 설치하면 함께 들어오는 `Gradle for Java` 확장이 좌측 액티비티 바에 **Gradle 전용 사이드바**(코끼리 아이콘)를 추가합니다. 명령어를 칠 필요 없이, 트리에서 태스크를 클릭해 실행할 수 있는 방법입니다.

1. 좌측 사이드바에서 **Gradle** 아이콘을 클릭합니다.
2. 프로젝트 트리를 펼치면 태스크가 그룹별로 정리돼 있습니다.
3. `Tasks` > `application` > `bootRun`을 찾습니다.
4. 항목 위에 마우스를 올리면 나타나는 **실행(▶) 버튼**을 누르거나, 항목을 우클릭해 `Run Task`를 선택합니다.

실행하면 내부적으로 `./gradlew bootRun`이 돌아가고, 결과는 Kiro 터미널 패널에 그대로 출력됩니다.

> 주의: 이 방식은 **프로파일 인자(`-Pprofile=local`) 없이** 기본값으로 태스크를 실행합니다. 이 프로젝트는 `application.yml`의 기본 프로파일이 `local`이라 그대로도 뜨지만, 빌드 시 의존성 해석이 프로파일에 따라 달라진다는 점(4번 섹션 참고)은 기억해 두세요. `-Pprofile` 값을 반드시 넘겨야 한다면 실행 방법 1(터미널)이 더 확실합니다.

인자를 붙여 실행하고 싶다면, Gradle 사이드바에서 `bootRun`을 우클릭한 뒤 `Run Task with Arguments`(또는 확장 버전에 따라 유사 메뉴)를 선택해 `-Pprofile=local` 같은 인자를 직접 입력할 수 있습니다.


## 7. 기동 확인

애플리케이션이 뜨면 프로젝트에 포함된 아웃바운드 API로 바로 확인할 수 있습니다.

```
http://localhost:8000/outbound/getWeather.do
```

인바운드 리시버는 POST로 테스트합니다.

```bash
curl -X POST http://localhost:8000/inbound/receiveData.do \
  -H "Content-Type: application/json" \
  -d '{"senderSystem":"DEVICE-A","dataType":"SENSOR","dataList":[{"deviceId":"D-001","temp":24.5}]}'
```

## 8. 자주 만나는 문제

**Q. `common-module not found` 경고가 뜬다.**
형제 폴더 구조(`../common-module`)가 맞는지 확인하세요. `settings.gradle` 실행 로그에 어떤 경로를 찾았는지 출력됩니다.

**Q. `UnsupportedClassVersionError` 또는 JDK 버전 오류.**
Gradle 데몬이 옛 JDK를 물고 있을 수 있습니다. `gradle.properties`의 `org.gradle.java.home` 경로를 확인하고, 데몬을 재시작하세요.

```powershell
./gradlew --stop
```

**Q. 터미널에서 `java -version`이 21이 아니다.**
`.vscode/settings.json` 저장 후 통합 터미널을 새로 열어야 환경변수가 반영됩니다. 기존 터미널은 갱신되지 않습니다.

**Q. Nexus 저장소 인증 오류(dev/stg/prd 프로파일).**
`build.gradle`이 `NEXUS_USERNAME` / `NEXUS_PASSWORD` 환경변수를 참조합니다. 로컬 개발이라면 굳이 필요 없는 `local` 프로파일을 쓰세요.

## 9. 부록 — Kiro 프롬프트 초안

이 프로젝트를 띄우기까지, Kiro에게 단계별로 요청한 프롬프트를 정리해 둡니다. "환경 분석 → 설정 → 실행" 순서로 대화를 쪼개면 AI가 맥락을 잃지 않고 삽질을 줄여줍니다.

### 1단계 — 시스템/프로젝트 환경 분석

먼저 프로젝트 구조와 실행 조건을 파악시키는 것부터 시작합니다.

```text
이 워크스페이스가 어떤 프로젝트인지 분석해줘.
build.gradle, settings.gradle, gradle.properties, application.yml을 읽고
- Java 버전, Spring Boot 버전, 빌드 도구
- 멀티모듈 구조와 의존 모듈(common-module) 위치
- 실행에 필요한 프로파일(local/dev/stg/prd) 차이
- 기본 포트
를 정리해줘.
```

```text
내 PC에는 JDK 8, 11, 21이 함께 깔려 있어.
전역 JAVA_HOME은 절대 바꾸지 말고, 이 프로젝트 범위 안에서만
JDK 21을 쓰려면 어떤 파일을 건드려야 하는지 알려줘.
```

### 2단계 — 프로젝트 단위 JDK/환경 설정

분석 결과를 바탕으로 실제 설정 파일을 만듭니다.

```text
전역 환경을 오염시키지 않는 조건으로 아래를 설정해줘.
- gradle.properties: Gradle 데몬이 D:/tools/jdk-21을 쓰도록
- .vscode/settings.json: Kiro 통합 터미널과 Java 확장 모두 JDK 21을 인식하도록
  (terminal.integrated.env.windows, java.jdt.ls.java.home,
   java.import.gradle.java.home, java.configuration.runtimes)
경로는 내 환경(D:\tools\jdk-21)에 맞춰줘.
```

```text
common-module은 형제 폴더(../common-module)에 있어.
settings.gradle이 로컬에서는 형제 폴더를, CI에서는 내부 폴더를
자동으로 찾도록 되어 있는지 확인해줘.
```

### 3단계 — 실행 및 기동 확인

설정이 끝나면 실제로 띄우고 검증합니다.

```text
통합 터미널에서 java -version이 21로 잡히는지 먼저 확인하고,
local 프로파일로 애플리케이션을 실행하는 명령을 알려줘.
```

```text
./gradlew bootRun -Pprofile=local 로 실행했더니 8000 포트에 떴어.
outbound/inbound API로 정상 기동을 확인하는 방법(curl 예시 포함)을 정리해줘.
```

### 문제 발생 시 — 디버깅 프롬프트

막혔을 때는 증상을 그대로 던지는 게 가장 빠릅니다.

```text
UnsupportedClassVersionError가 떠. Gradle 데몬이 옛 JDK를
물고 있는 것 같은데, 원인이랑 해결 순서를 알려줘.
```

```text
터미널에서 java -version이 여전히 21이 아니야.
.vscode/settings.json은 저장했는데 왜 반영이 안 되는지 짚어줘.
```

> 팁: 한 프롬프트에 "분석 + 설정 + 실행"을 몰아서 요청하기보다, 위처럼 단계를 나눠 요청하면 각 단계의 결과를 눈으로 확인하며 진행할 수 있어 훨씬 안정적입니다.
