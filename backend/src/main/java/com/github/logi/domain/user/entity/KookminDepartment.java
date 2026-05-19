package com.github.logi.domain.user.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum KookminDepartment {
    // 글로벌인문·지역대학
    GLOBAL_KOREAN_LANGUAGE("글로벌인문·지역대학", "한국어문학부"),
    GLOBAL_ENGLISH("글로벌인문·지역대학", "영어영문학부"),
    GLOBAL_CHINESE_LANGUAGE("글로벌인문·지역대학", "중어중문학과"),
    GLOBAL_KOREAN_HISTORY("글로벌인문·지역대학", "한국역사학과"),

    // 사회과학대학
    SOCIAL_PUBLIC_ADMIN("사회과학대학", "행정학과"),
    SOCIAL_POLITICAL_SCIENCE("사회과학대학", "정치외교학과"),
    SOCIAL_SOCIOLOGY("사회과학대학", "사회학과"),
    SOCIAL_MEDIA_ADVERTISING("사회과학대학", "미디어·광고학부"),
    SOCIAL_EDUCATION("사회과학대학", "교육학과"),
    SOCIAL_RUSSIAN_EURASIAN("사회과학대학", "러시아·유라시아학과"),
    SOCIAL_EAST_ASIAN_INTL("사회과학대학", "동아시아국제학부"),

    // 법과대학
    LAW_LAW("법과대학", "법학부"),
    LAW_CORPORATE_LAW("법과대학", "기업융합법학과"),

    // 경상대학
    BUSINESS_ECONOMICS("경상대학", "경제학과"),
    BUSINESS_INTERNATIONAL_TRADE("경상대학", "국제통상학과"),

    // 공과대학
    ENG_NEW_MATERIALS("공과대학", "신소재공학부"),
    ENG_MECHANICAL("공과대학", "기계공학부"),
    ENG_CONSTRUCTION_SYSTEMS("공과대학", "건설시스템공학부"),
    ENG_ELECTRONICS("공과대학", "전자공학부"),

    // 조형대학
    DESIGN_INDUSTRIAL("조형대학", "공업디자인학과"),
    DESIGN_VISUAL("조형대학", "시각디자인학과"),
    DESIGN_METAL_CRAFT("조형대학", "금속공예학과"),
    DESIGN_CERAMICS("조형대학", "도자공예학과"),
    DESIGN_FASHION("조형대학", "의상디자인학과"),
    DESIGN_SPATIAL("조형대학", "공간디자인학과"),
    DESIGN_VIDEO("조형대학", "영상디자인학과"),
    DESIGN_AUTO_TRANSPORT("조형대학", "자동차·운송디자인학과"),
    DESIGN_AI("조형대학", "AI디자인학과"),

    // 과학기술대학
    CST_FOREST_ENVIRONMENT("과학기술대학", "산림환경시스템학과"),
    CST_FOREST_BIOTECH("과학기술대학", "임산생명공학과"),
    CST_NANO_PHYSICS("과학기술대학", "나노전자물리학과"),
    CST_APPLIED_CHEMISTRY("과학기술대학", "응용화학부"),
    CST_FOOD_NUTRITION("과학기술대학", "식품영양학과"),
    CST_INFO_SECURITY_MATH("과학기술대학", "정보보안암호수학과"),
    CST_CONVERGENCE_BIO("과학기술대학", "융합바이오공학과"),

    // 예술대학
    ART_MUSIC("예술대학", "음악학부"),
    ART_FINE_ARTS("예술대학", "미술학부"),
    ART_PERFORMING("예술대학", "공연예술학부"),

    // 체육대학
    SPORTS_EDUCATION("체육대학", "스포츠교육학과"),
    SPORTS_INDUSTRY_LEISURE("체육대학", "스포츠산업레저학과"),
    SPORTS_HEALTH_REHAB("체육대학", "스포츠건강재활학과"),

    // 경영대학
    BIZ_MANAGEMENT("경영대학", "경영학부"),
    BIZ_CORPORATE_MGMT("경영대학", "기업경영학부"),
    BIZ_MGMT_INFO("경영대학", "경영정보학부"),
    BIZ_AI_BIGDATA("경영대학", "AI빅데이터융합경영학과"),
    BIZ_ACCOUNTING_TAX("경영대학", "회계세무학과"),

    // 소프트웨어융합대학
    SW_SOFTWARE("소프트웨어융합대학", "소프트웨어학부"),
    SW_AI("소프트웨어융합대학", "인공지능학부"),

    // 건축대학
    ARCH_ARCHITECTURE("건축대학", "건축학부"),

    // 자동차모빌리티대학
    AUTO_ENGINEERING("자동차모빌리티대학", "자동차공학과"),
    AUTO_IT_CONVERGENCE("자동차모빌리티대학", "자동차IT융합학과"),
    AUTO_FUTURE_MOBILITY("자동차모빌리티대학", "미래모빌리티학과"),

    // 미래융합대학
    FUTURE_CONVERGENCE("미래융합대학", null),

    // KMU International Business School
    KIBS("KMU International Business School", null);

    private final String college;
    private final String department;

    public String getFullName() {
        if (department == null) return college;
        return college + " " + department;
    }
}
