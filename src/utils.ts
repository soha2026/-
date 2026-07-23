import { PARTICIPANTS } from "./data";
import { Participant } from "./types";

export function generateMarkdown(participantId: string): string {
  const user = PARTICIPANTS[participantId];
  if (!user) return "";

  const sendTo = PARTICIPANTS[user.sendToId];
  const receiveFrom = PARTICIPANTS[user.receiveFromId];

  return `# 📚 6인의 2026 하반기 도서 로테이션 플랫폼 (7월 ~ 12월)

## 1. 메인 페이지 (사용자 선택 확인)
안녕하세요, **${user.name}**님! 👋 6인의 도서 로테이션 프로그램에 오신 것을 환영합니다!  
20년 경력의 베테랑 기획자가 제안하는 완성도 높은 가이드를 바탕으로, 한 분 한 분의 독서 경험을 더욱 소중히 엮어 드리겠습니다. 😊  
현재 **${user.name}**님의 이번 달 맞춤형 배송 가이드와 독서 현황판이 준비되었습니다.

---

## 2. ${user.name}님을 위한 이번 달 독서/배송 알림 (핵심 알림)
* **📅 교환독서 기간**: 2026년 7월 ~ 2026년 12월
* **🚨 도서 발송일**: **매달 25일** 서로에게 책을 보내는 날 🚚💨
* **📥 이번 달 받을 책**: 《**${receiveFrom.recommendedBook.title}**》 (보내는 사람: **${receiveFrom.name}**님)  
  * *${receiveFrom.name}님이 정성 들여 추천하신 도서가 곧 배송될 예정입니다!*
* **📤 이번 달 보낼 책**: 《**${user.recommendedBook.title}**》 (받는 사람: **${sendTo.name}**님)  
  * *다음 순번인 ${sendTo.name}님에게 소중한 책을 전달해 주세요!*
* **🎨 나의 전용 시그니처 펜색**: **${user.penColor}** ✏️
  * *기록이나 피드백 시 ${user.name}님을 상징하는 전용 펜색으로 활력을 불어넣어 보세요!*

---

## 3. 이번 달 로테이션 가이드 (보낼 주소 및 도서 소개)
**${user.name}**님이 책을 보내실 배송지 주소와 이번 달 만날 도서 정보입니다. 📍

### 📌 책 보낼 주소 (CU 편의점 택배 수령)
* **수령인**: **${sendTo.name}**님
* **CU 수령 지점**: \`${sendTo.address}\`

### 📖 이번 달 도서 소개
1. **내가 보내는 책**: 《**${user.recommendedBook.title}**》 (${user.name}님 추천 및 소유)  
   * **저자**: ${user.recommendedBook.author}  
   * **나의 시그니처 펜색**: ${user.penColor}  
   * **도서 소개**: ${user.recommendedBook.description}
2. **내가 받을 책**: 《**${receiveFrom.recommendedBook.title}**》 (${receiveFrom.name}님 추천 및 소유)  
   * **저자**: ${receiveFrom.recommendedBook.author}  
   * **상대의 시그니처 펜색**: ${receiveFrom.penColor}  
   * **도서 소개**: ${receiveFrom.recommendedBook.description}

---

## 4. 교환독서 6개월 매칭 달력 및 일정 기록 (사용자 액션 유도)
성공적인 로테이션을 위해 달력에서 날짜를 클릭하고 발송 또는 수령 상태를 등록해 주세요! ✔️

* **발송 완료 등록 📤**: 내가 추천 도서를 받는 파트너에게 발송했을 때 달력에서 발송일을 기록합니다.
* **수령 완료 등록 📥**: 상대방이 보낸 추천 도서를 받았을 때 달력에서 수령일을 기록합니다.
* **상대방 달력 자동 연동 🔄**: 내가 책을 수령했다고 기록하면, 책을 보낸 상대방의 달력에도 '수령' 정보가 실시간 연동되어 배송 완료를 즉시 확인할 수 있습니다!
`;
}
