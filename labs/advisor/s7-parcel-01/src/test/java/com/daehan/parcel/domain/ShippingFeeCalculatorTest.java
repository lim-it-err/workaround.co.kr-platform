package com.daehan.parcel.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 이지 모드 채점 테스트 — 미리 들어 있습니다. 이 파일은 고치지 말고, 전부 초록이 되게 구현하세요.
 * 처음 mvn -q test 를 돌리면 UnsupportedOperationException 으로 빨갛게 실패하는 게 정상입니다.
 */
class ShippingFeeCalculatorTest {

    private final ShippingFeeCalculator calculator = new ShippingFeeCalculator();

    private String quote(String name, int w, int d, int h, int grams, String zone, boolean remote, boolean cod) {
        return calculator.quote(new Parcel(name, w, d, h, grams, zone, remote, cod));
    }

    @Nested
    @DisplayName("App.java 기대 출력 네 건")
    class Scenarios {

        @Test
        void 베개는_부피중량으로_청구된다() {
            assertEquals(
                    "[메모리폼 베개] 부피중량 4.0kg / 실중량 1.2kg → 청구중량 4.0kg\n"
                            + "기본 5,000원 + 권역 1,000원 = 6,000원",
                    quote("메모리폼 베개", 40, 30, 20, 1200, "OTHER", false, false));
        }

        @Test
        void 제주행_착불_이불은_할증이_둘_붙는다() {
            assertEquals(
                    "[겨울 이불] 부피중량 13.4kg / 실중량 9.0kg → 청구중량 13.5kg\n"
                            + "기본 8,000원 + 권역 3,000원 + 착불 500원 = 11,500원",
                    quote("겨울 이불", 50, 40, 40, 9000, "JEJU", false, true));
        }

        @Test
        void 작은_상자는_실중량으로_청구되고_권역_0원은_빠진다() {
            assertEquals(
                    "[문구 세트] 부피중량 0.5kg / 실중량 2.0kg → 청구중량 2.0kg\n"
                            + "기본 4,000원 + 도서산간 5,000원 = 9,000원",
                    quote("문구 세트", 25, 20, 5, 2000, "SAME", true, false));
        }

        @Test
        void 세_변의_합이_넘으면_접수_불가() {
            assertEquals(
                    "[접이식 책상] 접수 불가: 세 변의 합 170cm 가 160cm 를 넘습니다",
                    quote("접이식 책상", 80, 50, 40, 12000, "OTHER", false, false));
        }
    }

    @Nested
    @DisplayName("0.5kg 올림 경계")
    class HalfKgRounding {

        @Test
        void 실중량_정확히_2kg_은_첫_구간() {
            assertTrue(quote("경계 A", 10, 10, 10, 2000, "SAME", false, false).endsWith("= 4,000원"));
        }

        @Test
        void 실중량_2001g_은_2_5kg_로_올라가_다음_구간() {
            String q = quote("경계 B", 10, 10, 10, 2001, "SAME", false, false);
            assertTrue(q.contains("청구중량 2.5kg"), q);
            assertTrue(q.endsWith("= 5,000원"), q);
        }

        @Test
        void 부피중량이_정확히_2kg_이면_올라가지_않는다_double_함정() {
            // 30 × 20 × 20 = 12,000cm³ → 12,000 × 1000 ÷ 6000 = 정확히 2,000g
            String q = quote("경계 C", 30, 20, 20, 500, "SAME", false, false);
            assertTrue(q.contains("청구중량 2.0kg"), q);
            assertTrue(q.endsWith("= 4,000원"), q);
        }
    }

    @Nested
    @DisplayName("접수 가능 경계")
    class AcceptanceLimits {

        @Test
        void 세_변의_합_160cm_는_접수() {
            assertTrue(quote("합 160", 60, 50, 50, 1000, "SAME", false, false).endsWith("= 10,000원"));
        }

        @Test
        void 세_변의_합_161cm_는_불가() {
            assertEquals("[합 161] 접수 불가: 세 변의 합 161cm 가 160cm 를 넘습니다",
                    quote("합 161", 61, 50, 50, 1000, "SAME", false, false));
        }

        @Test
        void 가장_긴_변_100cm_는_접수() {
            assertTrue(quote("변 100", 100, 30, 30, 1000, "SAME", false, false).endsWith("= 8,000원"));
        }

        @Test
        void 가장_긴_변_101cm_는_불가() {
            String q = quote("변 101", 101, 30, 29, 1000, "SAME", false, false);
            assertTrue(q.startsWith("[변 101] 접수 불가"), q);
            assertTrue(q.contains("100cm"), q);
        }

        @Test
        void 실중량_30kg_은_접수() {
            assertTrue(quote("30kg", 20, 20, 20, 30000, "SAME", false, false).endsWith("= 10,000원"));
        }

        @Test
        void 실중량_30_001g_은_불가() {
            String q = quote("30kg 초과", 20, 20, 20, 30001, "SAME", false, false);
            assertTrue(q.startsWith("[30kg 초과] 접수 불가"), q);
            assertTrue(q.contains("30kg"), q);
        }
    }
}