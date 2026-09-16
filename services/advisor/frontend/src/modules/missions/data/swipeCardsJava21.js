export const JAVA21_SWIPE_CHOICES = [
  { key: 'good', label: '좋다' },
  { key: 'fix', label: '고친다' },
]

export const swipeCardsJava21 = [
  {
    id: 'java21-record-money',
    title: '값 객체의 조건을 생성 시점에 지킵니다',
    topic: 'record',
    code: `record Money(BigDecimal amount, Currency currency) {
  Money {
    requireNonNull(amount);
    requireNonNull(currency);
  }
}`,
    correct: 'good',
    correctToken: 'record',
    reason: 'record의 컴팩트 생성자가 모든 인스턴스의 불변 조건을 한곳에서 지킵니다.',
    explain: '접근자와 값 동등성은 record가 맡고 생성자는 유효성에만 집중합니다. 금액 자체의 범위 검증은 도메인 규칙에 맞춰 더할 수 있습니다.',
    compileStatus: 'compiles',
    compileNote: 'Java 21, java.math.BigDecimal·java.util.Currency import와 Objects.requireNonNull 정적 import 기준.',
  },
  {
    id: 'java21-record-list-alias',
    title: 'record에 주문 항목 목록을 그대로 보관합니다',
    topic: 'record',
    code: `record Order(List<Line> lines) {
  Order {
    requireNonNull(lines);
  }
}`,
    correct: 'fix',
    correctToken: 'record',
    reason: 'record도 가변 목록의 참조를 그대로 받으면 내부 상태가 밖에서 바뀔 수 있습니다.',
    explain: 'null 검사만으로는 얕은 불변성도 보장하지 못합니다. 생성자에서 lines = List.copyOf(lines)로 방어 복사하세요.',
    compileStatus: 'compiles',
    compileNote: 'Java 21, Line 타입과 java.util.List import 및 Objects.requireNonNull 정적 import 기준.',
  },
  {
    id: 'java21-record-jakarta-validation',
    title: 'Spring Boot 3 요청 record에 Jakarta 검증을 붙입니다',
    topic: 'record',
    code: `record SignupRequest(
    @NotBlank String email,
    @Size(min = 12) String password
) {}`,
    correct: 'good',
    correctToken: 'record',
    reason: 'Spring Boot 3의 Jakarta 검증 제약을 record 컴포넌트에 직접 선언해 입력 계약이 드러납니다.',
    explain: '컨트롤러 매개변수에 @Valid를 붙이면 이 계약이 요청 경계에서 실행됩니다. javax.validation이 아니라 jakarta.validation import를 써야 합니다.',
    compileStatus: 'compiles',
    compileNote: 'Spring Boot 3, jakarta.validation.constraints.NotBlank·Size import 기준.',
  },
  {
    id: 'java21-sealed-payment',
    title: '결제 수단의 닫힌 계층을 선언합니다',
    topic: 'sealed',
    code: `sealed interface Payment permits Card, Cash {}
record Card(String token) implements Payment {}
record Cash(BigDecimal amount) implements Payment {}`,
    correct: 'good',
    correctToken: 'sealed',
    reason: '허용된 하위 타입이 선언부에 모여 결제 수단의 닫힌 범위가 명확합니다.',
    explain: 'record는 암묵적으로 final이라 sealed 계층의 직접 구현체가 될 수 있습니다. 새 결제 수단을 추가하면 컴파일러가 관련 switch 갱신을 요구합니다.',
    compileStatus: 'compiles',
    compileNote: 'Java 21, java.math.BigDecimal import 기준.',
  },
  {
    id: 'java21-sealed-nonsealed-hole',
    title: '명령 종류를 닫아두면서 구현 하나는 다시 엽니다',
    topic: 'sealed',
    code: `sealed interface Command permits AdminCommand {}
non-sealed class AdminCommand implements Command {
  void run() {}
}`,
    correct: 'fix',
    correctToken: 'sealed',
    reason: 'non-sealed 구현은 누구나 하위 타입을 늘릴 수 있어 닫힌 명령 집합이라는 의도를 무너뜨립니다.',
    explain: '확장을 허용할 이유가 없다면 AdminCommand를 final로 닫으세요. 의도적 확장 지점이라면 이름과 문서로 그 계약을 드러내야 합니다.',
    compileStatus: 'compiles',
    compileNote: 'Java 21 단독 컴파일 기준.',
  },
  {
    id: 'java21-switch-record-pattern',
    title: '결제 타입을 record 패턴으로 분해합니다',
    topic: 'switch 패턴 매칭',
    code: `static BigDecimal fee(Payment payment) {
  return switch (payment) {
    case Card(var token) -> new BigDecimal("0.03");
    case Cash(var amount) -> BigDecimal.ZERO;
  };
}`,
    correct: 'good',
    correctToken: 'switch 패턴',
    reason: 'sealed 계층과 record 패턴을 함께 써서 분기와 구조 분해가 빠짐없이 읽힙니다.',
    explain: 'default가 없어도 Payment의 허용 타입을 모두 다루므로 컴파일러가 완전성을 확인합니다. 새 구현체가 생기면 이 코드가 조용히 누락되지 않습니다.',
    compileStatus: 'compiles',
    compileNote: 'Java 21, 앞 카드의 Payment·Card·Cash와 java.math.BigDecimal 기준.',
  },
  {
    id: 'java21-switch-null-explicit',
    title: '상태 분기에서 null을 명시적으로 다룹니다',
    topic: 'switch 패턴 매칭',
    code: `return switch (status) {
  case null -> "unknown";
  case ACTIVE -> "active";
  case PAUSED -> "paused";
};`,
    correct: 'good',
    correctToken: 'switch 패턴',
    reason: 'null 처리와 모든 enum 상수가 한 switch 식에 드러나 입력 계약을 놓치지 않습니다.',
    explain: 'Java 21 switch는 case null을 지원하므로 별도 선행 if가 필요 없습니다. Status가 ACTIVE와 PAUSED 두 상수인 문맥에서 완전한 식입니다.',
    compileStatus: 'compiles',
    compileNote: 'Java 21, ACTIVE·PAUSED만 가진 Status enum과 이를 반환하는 메서드 본문 기준.',
  },
  {
    id: 'java21-switch-dominated-pattern',
    title: '넓은 패턴 뒤에 문자열 패턴을 둡니다',
    topic: 'switch 패턴 매칭',
    code: `return switch (value) {
  case Object ignored -> "other";
  case String text -> text.trim();
};`,
    correct: 'fix',
    correctToken: 'switch 패턴',
    reason: 'Object 패턴이 모든 비-null 값을 먼저 잡아 뒤의 String 패턴이 지배되어 컴파일되지 않습니다.',
    explain: '구체적인 String case를 Object case보다 앞에 두세요. 이 카드는 Java 21의 패턴 지배 검사를 보여 주기 위한 의도된 컴파일 오류입니다.',
    compileStatus: 'intentional-error',
    compileNote: '의도된 javac 오류: String case가 앞선 Object case에 의해 dominated 됩니다.',
  },
  {
    id: 'java21-virtual-executor',
    title: '독립적인 블로킹 조회를 가상 스레드로 실행합니다',
    topic: 'virtual threads',
    code: `try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
  var futures = ids.stream()
      .map(id -> CompletableFuture.supplyAsync(() -> client.fetch(id), executor))
      .toList();
  return futures.stream().map(CompletableFuture::join).toList();
}`,
    correct: 'good',
    correctToken: 'virtual threads',
    reason: '요청별 블로킹 I/O를 가상 스레드에 맡기고 executor 수명도 명시적으로 닫습니다.',
    explain: '가상 스레드는 블로킹 코드를 익숙한 구조로 유지하면서 많은 동시 작업을 다루는 데 맞습니다. join이 감싼 실패를 서비스의 오류 계약으로 변환해야 합니다.',
    compileStatus: 'compiles',
    compileNote: 'Java 21, ids·client 문맥과 java.util.concurrent.Executors·CompletableFuture import 기준.',
  },
  {
    id: 'java21-virtual-synchronized-io',
    title: '가상 스레드에서 락을 잡은 채 원격 호출합니다',
    topic: 'virtual threads',
    code: `synchronized (lock) {
  return client.fetch(id);
}`,
    correct: 'fix',
    correctToken: 'virtual threads',
    reason: 'Java 21에서는 synchronized 안의 블로킹 I/O가 가상 스레드의 carrier를 고정할 수 있습니다.',
    explain: '임계 구역에서 원격 호출을 빼거나 ReentrantLock처럼 고정을 피하는 동기화 수단을 검토하세요. 짧은 CPU 임계 구역 자체를 금지하는 규칙은 아닙니다.',
    compileStatus: 'compiles',
    compileNote: 'Java 21, lock·client·id가 선언된 메서드 본문 기준.',
  },
  {
    id: 'java21-virtual-threadlocal-buffer',
    title: '가상 스레드마다 1MB 버퍼를 둡니다',
    topic: 'virtual threads',
    code: `private static final ThreadLocal<byte[]> BUFFER =
    ThreadLocal.withInitial(() -> new byte[1_048_576]);

void handle() {
  Thread.startVirtualThread(() -> use(BUFFER.get()));
}`,
    correct: 'fix',
    correctToken: 'virtual threads',
    reason: '매우 많은 가상 스레드에 무거운 ThreadLocal 값을 하나씩 두면 메모리 이점이 사라집니다.',
    explain: '버퍼 풀이나 작업 범위의 명시적 인자로 수명을 제한하세요. 가상 스레드는 싸지만 그 안에 붙이는 상태까지 자동으로 싸지는 않습니다.',
    compileStatus: 'compiles',
    compileNote: 'Java 21, use(byte[]) 메서드가 있는 클래스 기준.',
  },
  {
    id: 'spring3-tx-order-outbox',
    title: '주문과 아웃박스를 한 트랜잭션에 저장합니다',
    topic: '@Transactional 경계',
    code: `@Transactional
public void place(Order order) {
  orders.save(order);
  outbox.save(Event.from(order));
}`,
    correct: 'good',
    correctToken: '@Transactional',
    reason: '같이 성공하거나 같이 실패해야 하는 두 데이터베이스 쓰기가 한 서비스 경계에 묶였습니다.',
    explain: '외부 메시지 발행 대신 아웃박스 레코드를 함께 저장해 로컬 원자성을 확보합니다. 별도 발행기가 커밋된 이벤트를 전달하면 됩니다.',
    compileStatus: 'compiles',
    compileNote: 'Spring Boot 3, Spring @Transactional과 Order·Event·repository 필드가 선언된 서비스 기준.',
  },
  {
    id: 'spring3-tx-private-self-call',
    title: '같은 서비스의 private 메서드에 트랜잭션을 겁니다',
    topic: '@Transactional 경계',
    code: `public void place(Order order) {
  save(order);
}
@Transactional
private void save(Order order) {
  orders.save(order);
}`,
    correct: 'fix',
    correctToken: '@Transactional',
    reason: '같은 객체의 private 메서드 호출은 Spring 프록시를 지나지 않아 트랜잭션이 열리지 않습니다.',
    explain: '공개 서비스 경계에 @Transactional을 옮기거나 별도 빈으로 책임을 분리하세요. 코드는 컴파일되므로 실행 의미를 테스트해야 잡히는 결함입니다.',
    compileStatus: 'compiles',
    compileNote: 'Spring Boot 3, Spring @Transactional과 Order·repository 필드가 선언된 서비스 기준.',
  },
  {
    id: 'spring3-tx-remote-call',
    title: 'DB 저장과 결제를 한 트랜잭션 메서드에 둡니다',
    topic: '@Transactional 경계',
    code: `@Transactional
public void place(Order order) {
  orders.save(order);
  paymentClient.charge(order.id());
}`,
    correct: 'fix',
    correctToken: '@Transactional',
    reason: '원격 결제 중에도 DB 트랜잭션을 붙잡지만 두 시스템의 원자성은 보장하지 못합니다.',
    explain: '로컬 커밋 경계를 짧게 유지하고 결제는 멱등키와 상태 전이 또는 아웃박스로 조정하세요. 타임아웃 뒤 결제 성공 여부가 불명확한 경우도 계약에 포함해야 합니다.',
    compileStatus: 'compiles',
    compileNote: 'Spring Boot 3, Spring @Transactional과 Order·repository·paymentClient 문맥 기준.',
  },
  {
    id: 'java21-optional-boundary',
    title: '없을 수 있는 조회 결과를 경계에서 끝냅니다',
    topic: 'Optional',
    code: `return users.findById(id)
    .map(User::email)
    .orElseThrow(UserNotFound::new);`,
    correct: 'good',
    correctToken: 'Optional',
    reason: '조회 부재를 Optional로 받은 뒤 서비스 경계에서 명시적인 예외 계약으로 끝냅니다.',
    explain: 'Optional을 필드나 매개변수로 퍼뜨리지 않고 반환값 처리에만 씁니다. 호출자는 null 가능성을 추측할 필요가 없습니다.',
    compileStatus: 'compiles',
    compileNote: 'Java 21, users·id·User·UserNotFound가 선언된 메서드 기준.',
  },
  {
    id: 'spring3-optional-entity-field',
    title: 'JPA 엔티티 필드를 Optional로 선언합니다',
    topic: 'Optional',
    code: `@Entity
class User {
  @Id Long id;
  Optional<String> nickname;
}`,
    correct: 'fix',
    correctToken: 'Optional',
    reason: 'Optional은 반환 계약용 타입이라 JPA 엔티티 필드에 두면 영속화 모델과 도구 호환성을 해칩니다.',
    explain: '필드는 nullable String으로 매핑하고 외부 접근자에서 Optional.ofNullable을 반환하세요. 컴파일 성공과 JPA 매핑 적합성은 다른 문제입니다.',
    compileStatus: 'compiles',
    compileNote: 'Spring Boot 3, jakarta.persistence.Entity·Id와 java.util.Optional import 기준.',
  },
  {
    id: 'java21-immutable-copyof',
    title: '생성자에서 목록의 불변 사본을 만듭니다',
    topic: '불변 컬렉션',
    code: `final class Cart {
  private final List<Item> items;
  Cart(List<Item> items) {
    this.items = List.copyOf(items);
  }
}`,
    correct: 'good',
    correctToken: '불변 컬렉션',
    reason: 'List.copyOf가 호출자의 목록과 별개인 수정 불가 사본을 만들어 별칭 변경을 막습니다.',
    explain: '목록 구조의 불변성은 확보되지만 Item 자체가 가변이면 깊은 불변성까지 생기지는 않습니다. 필요한 불변 수준을 도메인 계약으로 정하세요.',
    compileStatus: 'compiles',
    compileNote: 'Java 21, Item 타입과 java.util.List import 기준.',
  },
  {
    id: 'java21-unmodifiable-view',
    title: '호출자의 목록을 수정 불가 뷰로 감쌉니다',
    topic: '불변 컬렉션',
    code: `Cart(List<Item> items) {
  this.items = Collections.unmodifiableList(items);
}`,
    correct: 'fix',
    correctToken: '불변 컬렉션',
    reason: '수정 불가 뷰도 원본 목록이 바뀌면 함께 바뀌므로 생성 뒤 상태가 고정되지 않습니다.',
    explain: 'List.copyOf(items)로 원본과 분리된 사본을 보관하세요. unmodifiableList는 뷰를 통한 변경만 막습니다.',
    compileStatus: 'compiles',
    compileNote: 'Java 21, Cart의 items 필드·Item 타입과 java.util.Collections·List import 기준.',
  },
  {
    id: 'java21-var-obvious-constructor',
    title: '생성자 오른쪽이 타입을 바로 말해 줍니다',
    topic: 'var',
    code: `var request = new CheckoutRequest(orderId, items);
return checkout.execute(request);`,
    correct: 'good',
    correctToken: 'var',
    reason: '오른쪽 생성자가 타입을 즉시 보여 주므로 var가 중복만 줄이고 의미는 숨기지 않습니다.',
    explain: 'var는 로컬 변수에서만 쓰이고 request라는 이름도 역할을 설명합니다. 타입이 추론 가능하다는 사실보다 읽는 사람이 쉽게 아는지가 기준입니다.',
    compileStatus: 'compiles',
    compileNote: 'Java 21, CheckoutRequest·orderId·items·checkout 문맥의 메서드 본문 기준.',
  },
  {
    id: 'java21-var-hidden-result',
    title: '서비스 실행 결과의 타입을 var로 감춥니다',
    topic: 'var',
    code: `var result = service.execute(command);
if (result.isRetryable()) {
  retry(command);
}
return result;`,
    correct: 'fix',
    correctToken: 'var',
    reason: '오른쪽 호출만으로 핵심 결과 타입이 드러나지 않아 리뷰어가 계약을 추적해야 합니다.',
    explain: 'DecisionResult처럼 의미 있는 명시 타입을 쓰면 재시도 판단의 계약이 한눈에 보입니다. var를 금지하기보다 정보가 사라지는 자리에만 제한하세요.',
    compileStatus: 'compiles',
    compileNote: 'Java 21, service.execute 반환 타입에 isRetryable이 있고 retry·command가 선언된 메서드 기준.',
  },
].map((card) => ({ ...card, choices: JAVA21_SWIPE_CHOICES }))

export default swipeCardsJava21
