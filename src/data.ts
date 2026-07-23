import { Participant } from "./types";
import coverTwoWomen from "./assets/images/cover_two_women_real_1783077593364.jpg";
import coverYoungAuthors from "./assets/images/cover_young_authors_real_1783077917042.jpg";
import coverPendingSelection from "./assets/images/cover_pending_selection_1783077142510.jpg";
import coverSuperArtThomason from "./assets/images/cover_super_art_thomason_1784781107387.jpg";
import coverCoolUnnie from "./assets/images/cover_cool_unnie_real_1783078078009.jpg";
import coverTravelReason from "./assets/images/cover_travel_reason_real_1783078093675.jpg";
import coverRhythmSea from "./assets/images/cover_rhythm_sea_real_1783078107071.jpg";

export const PARTICIPANTS: Record<string, Participant> = {
  soha: {
    id: "soha",
    name: "소하",
    address: "CU 숭실대점",
    penColor: "주황",
    recommendedBook: {
      title: "여자 둘이 살고 있습니다",
      author: "김하나, 황선우",
      description: "혼자도 결혼도 아닌, 새로운 형태의 ‘조립식 가족’ 탄생기! 출간 5주년을 맞아 전면 개정판으로 출간된 화제작입니다. 영국 펭귄랜덤하우스, 미국 하퍼콜린스 등 전 세계 유수의 출판사와 억대 판권 수출 계약을 맺고 <뉴욕 타임스>가 ‘가족의 개념을 재정의한다’며 극찬한 바 있습니다. 고양이 네 마리와 두 명의 여성이 함께 집을 가꾸고 조화롭게 살아가는 일상과 현대 사회에 던지는 다정한 혁명적 메시지를 만나보세요. 🏡🐾",
      recommendedBy: "소하",
      imageUrl: coverTwoWomen,
    },
    sendToId: "gaji",
    receiveFromId: "ineu",
  },
  gaji: {
    id: "gaji",
    name: "가지",
    address: "CU영통2단지점",
    penColor: "남색",
    recommendedBook: {
      title: "2026 제17회 젊은작가상 수상작품집",
      author: "김채원, 길란, 남의현, 서장원, 위수정, 이미상, 함윤이",
      description: "한국문학의 미래와 함께하고자 2010년 제정된 젊은작가상이 2026년 올해로 17회를 맞이했습니다. 데뷔 10년 이내의 젊은 작가들이 한 해 동안 발표한 소설 중 가장 눈부신 성취를 보여준 작품을 엄선한 소설집입니다. 이번 제17회 대상작은 고유한 서사를 정교하게 배치한 김채원 작가의 ‘별 세 개가 떨어지다’로 선정되었으며, 길란(‘추도’), 남의현(‘나는 야구를 사랑해’), 서장원(‘히데오’), 위수정(‘귀신이 없는 집’), 이미상(‘일일야성’), 함윤이(‘우리의 적들’) 등 독창적이고 역동적인 한국문학의 새로운 영토를 펼쳐 보이는 일곱 편의 소설을 담았습니다. 궤도를 벗어나 다채롭게 빛나는 젊은 문학의 역동적인 숨결을 느껴보세요. 🌟✨",
      recommendedBy: "가지",
      imageUrl: coverYoungAuthors,
    },
    sendToId: "geul",
    receiveFromId: "soha",
  },
  geul: {
    id: "geul",
    name: "글",
    address: "CU시화MTV2호점",
    penColor: "형광연두",
    recommendedBook: {
      title: "초예술 토머슨",
      author: "아카세가와 겐페이",
      description: "거리의 기묘하고 무용(無用)하며 유쾌한 예술적 오브제 '토머슨'을 탐구하는 아카세가와 겐페이의 전설적인 명작! 지붕 없는 계단, 막힌 창문 등 일상 속 엉뚱하고 사랑스러운 현대 도시의 스펙터클을 유쾌하고 재치 넘치게 탐구해 보여주는 매혹적인 예술 기행서입니다. 🏢🔍",
      recommendedBy: "글",
      imageUrl: coverSuperArtThomason,
    },
    sendToId: "yuria",
    receiveFromId: "gaji",
  },
  yuria: {
    id: "yuria",
    name: "유리아",
    address: "CU관악한울점",
    penColor: "분홍",
    recommendedBook: {
      title: "멋있으면 다 언니",
      author: "황선우",
      description: "나이와 한계를 뛰어넘어 자기만의 고유한 일과 삶을 당당하고 유쾌하게 일구어낸 멋진 여성들의 일과 삶을 다룬 인터뷰집입니다. 김유라, 김보라, 이슬아, 장혜영, 손열음, 전주연, 자야, 재재, 이수정 등 각자의 자리에서 좋아하는 마음의 힘을 믿고 씩씩하게 길을 내는 아홉 명의 여성들과 만나 나누는 반짝이는 성취와 연대의 지혜를 만나보세요! 💪✨",
      recommendedBy: "유리아",
      imageUrl: coverCoolUnnie,
    },
    sendToId: "becky",
    receiveFromId: "geul",
  },
  becky: {
    id: "becky",
    name: "베키",
    address: "CU풍무유로점",
    penColor: "하늘",
    recommendedBook: {
      title: "여행의 이유",
      author: "김영하",
      description: "인기 작가 김영하가 첫 여행을 떠났던 순간부터 오랜 시간 길 위에서 발견하고 느낀 삶과 인간에 대한 사색을 아홉 개의 이야기로 풀어낸 대표 베스트셀러 산문집입니다. 60만 부 이상의 판매고를 기록하며 많은 독자들의 사랑을 받아온 이 에세이가 2024년 더욱 깊어진 작가의 시선과 아름다운 디자인의 개정증보판으로 새롭게 태어났습니다. 나를 비우고 다시 일어설 힘을 주는 특별한 여행을 만나보세요. ✈️🗺️",
      recommendedBy: "베키",
      imageUrl: coverTravelReason,
    },
    sendToId: "ineu",
    receiveFromId: "yuria",
  },
  ineu: {
    id: "ineu",
    name: "이는",
    address: "CU미아해링턴점",
    penColor: "보라",
    recommendedBook: {
      title: "리듬 난바다",
      author: "김멜라",
      description: "젊은작가상 대상, 문지문학상, 이효석문학상 대상 등을 휩쓸며 한국 독자들의 뜨거운 사랑을 받는 김멜라 작가의 새로운 장편소설입니다. ‘주간 문학동네’ 연재 후 대대적인 전면 개고를 통해 한층 더 완성도 높게 빚어졌으며, 한적한 바닷가 마을을 배경으로 파도처럼 밀려오는 짜릿하고 감각적인 사랑과 삶의 리듬을 유쾌하고 농염하게 그려냈습니다. 멈출 수 없는 유쾌한 러브 드라이브를 감상해 보세요. 🌊🍓",
      recommendedBy: "이는",
      imageUrl: coverRhythmSea,
    },
    sendToId: "soha",
    receiveFromId: "becky",
  },
};

export const ROTATION_ORDER = ["soha", "gaji", "geul", "yuria", "becky", "ineu"];
