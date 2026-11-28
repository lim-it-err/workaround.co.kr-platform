package com.daehan.parcel.engine;

/**
 * 대한택배 운임표 (계약서 부속서 2).
 * 이 파일은 엔진입니다. 그대로 사용하세요. 수정/재구현 대상이 아닙니다.
 */
public final class RateTable {

    /** 청구중량 상한(0.5kg 단위 개수)과 기본 운임(원). 위에서부터 처음 맞는 구간을 쓴다. */
    private static final int[][] BRACKETS = {
            {4, 4000},    // ~ 2.0kg
            {10, 5000},   // ~ 5.0kg
            {20, 6500},   // ~ 10.0kg
            {40, 8000},   // ~ 20.0kg
            {60, 10000},  // ~ 30.0kg
    };

    /** 청구중량(0.5kg 단위 개수)에 해당하는 기본 운임. 30kg 초과면 -1. */
    public int baseFee(int halfKgUnits) {
        for (int[] b : BRACKETS) {
            if (halfKgUnits <= b[0]) return b[1];
        }
        return -1;
    }

    /** 권역 할증(원). SAME=같은 권역, OTHER=다른 권역, JEJU=제주. 모르는 권역이면 -1. */
    public int zoneSurcharge(String zone) {
        return switch (zone) {
            case "SAME" -> 0;
            case "OTHER" -> 1000;
            case "JEJU" -> 3000;
            default -> -1;
        };
    }

    /** 도서산간 할증(원). */
    public int remoteSurcharge() {
        return 5000;
    }

    /** 착불 수수료(원). */
    public int collectOnDeliveryFee() {
        return 500;
    }
}