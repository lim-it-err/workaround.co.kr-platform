package com.daehan.parcel.domain;

/** 소포 접수 정보 (완성된 코드 — 그대로 사용) */
public record Parcel(
        String name,
        int widthCm,
        int depthCm,
        int heightCm,
        int actualGrams,       // 실중량(g)
        String zone,           // SAME | OTHER | JEJU
        boolean remote,        // 도서산간 여부
        boolean collectOnDelivery // 착불 여부
) {
}