import { Language, QuizQuestion } from './types';

export const QUESTIONS_DB: QuizQuestion[] = [
  {
    id: 1,
    question: {
      [Language.EN]: 'What is 2 + 2 * 2?',
      [Language.PL]: 'Ile to jest 2 + 2 * 2?',
      [Language.UA]: 'Скільки буде 2 + 2 * 2?',
      [Language.RU]: 'Сколько будет 2 + 2 * 2?',
      [Language.JA]: '2 + 2 * 2 はいくつですか？'
    },
    options: {
      [Language.EN]: ['6', '8', '4', '10'],
      [Language.PL]: ['6', '8', '4', '10'],
      [Language.UA]: ['6', '8', '4', '10'],
      [Language.RU]: ['6', '8', '4', '10'],
      [Language.JA]: ['6', '8', '4', '10']
    },
    correctIndex: 0
  },
  {
    id: 2,
    question: {
      [Language.EN]: 'Which planet is the Red Planet?',
      [Language.PL]: 'Która planeta to Czerwona Planeta?',
      [Language.UA]: 'Яка планета є Червоною планетою?',
      [Language.RU]: 'Какая планета называется Красной?',
      [Language.JA]: '赤い惑星と呼ばれる惑星はどれですか？'
    },
    options: {
      [Language.EN]: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      [Language.PL]: ['Wenus', 'Mars', 'Jowisz', 'Saturn'],
      [Language.UA]: ['Венера', 'Марс', 'Юпітер', 'Сатурн'],
      [Language.RU]: ['Венера', 'Марс', 'Юпитер', 'Сатурн'],
      [Language.JA]: ['金星', '火星', '木星', '土星']
    },
    correctIndex: 1
  },
  {
    id: 3,
    question: {
      [Language.EN]: 'Capital of France?',
      [Language.PL]: 'Stolica Francji?',
      [Language.UA]: 'Столиця Франції?',
      [Language.RU]: 'Столица Франции?',
      [Language.JA]: 'フランスの首都は？'
    },
    options: {
      [Language.EN]: ['London', 'Berlin', 'Madrid', 'Paris'],
      [Language.PL]: ['Londyn', 'Berlin', 'Madryt', 'Paryż'],
      [Language.UA]: ['Лондон', 'Берлін', 'Мадрид', 'Париж'],
      [Language.RU]: ['Лондон', 'Берлин', 'Мадрид', 'Париж'],
      [Language.JA]: ['ロンドン', 'ベルリン', 'マドリード', 'パリ']
    },
    correctIndex: 3
  }
];

export const FLAVOR_DB = {
  [Language.EN]: {
    encounters: [
      'You find a rusty coin on the floor.',
      'A cold wind blows from the darkness.',
      'You hear a distant, chilling whisper.',
      'Rats scurry away as you approach.',
      'The smell of sulfur fills the air.',
      'You stumble upon old bones.',
      'A torch flickers and dies nearby.',
      'Dust falls from the ceiling.'
    ],
    boss_intros: [
      'The Ancient One awakens!',
      'You have entered the Forbidden Zone!',
      'Prepare to meet your doom!',
      'The Boss laughs at your puny presence.'
    ]
  },
  [Language.PL]: {
    encounters: [
      'Znajdujesz zardzewiałą monetę.',
      'Z ciemności wieje zimny wiatr.',
      'Słyszysz odległy, mrożący krew szept.',
      'Szczury uciekają na twój widok.',
      'W powietrzu unosi się zapach siarki.',
      'Potykasz się o stare kości.',
      'Pochodnia w pobliżu migocze i gaśnie.',
      'Kurz opada z sufitu.'
    ],
    boss_intros: [
      'Pradawny się budzi!',
      'Wkroczyłeś do Zakazanej Strefy!',
      'Przygotuj się na swoje przeznaczenie!',
      'Boss śmieje się z twojej obecności.'
    ]
  },
  [Language.UA]: {
    encounters: [
      'Ти знаходиш іржаву монету.',
      'З темряви дме холодний вітер.',
      'Ти чуєш далекий шепіт.',
      'Щури тікають, коли ти наближаєшся.',
      'Повітря наповнене запахом сірки.',
      'Ти спотикаєшся об старі кістки.',
      'Смолоскип поруч мерехтить і гасне.',
      'Зі стелі сиплеться пил.'
    ],
    boss_intros: [
      'Стародавній прокидається!',
      'Ти увійшов у Заборонену Зону!',
      'Готуйся до зустрічі зі своєю долею!',
      'Бос сміється з твоєї присутності.'
    ]
  },
  [Language.RU]: {
    encounters: [
      'Ты находишь ржавую монету.',
      'Из темноты дует холодный ветер.',
      'Ты слышишь далекий пугающий шепот.',
      'Крысы разбегаются при твоем приближении.',
      'В воздухе пахнет серой.',
      'Ты спотыкаешься о старые кости.',
      'Факел рядом мерцает и гаснет.',
      'С потолка сыплется пыль.'
    ],
    boss_intros: [
      'Древний пробуждается!',
      'Ты вошел в Запретную Зону!',
      'Приготовься встретить свою судьбу!',
      'Босс смеется над твоим присутствием.'
    ]
  },
  [Language.JA]: {
    encounters: [
      '床に錆びたコインを見つけた。',
      '闇の奥から冷たい風が吹いてくる。',
      '遠くで不気味なささやきが聞こえる。',
      '近づくとネズミたちが走り去る。',
      '硫黄のにおいが空気を満たしている。',
      '古い骨につまずいた。',
      '近くの松明が揺らめき、消えた。',
      '天井からほこりが落ちてくる。'
    ],
    boss_intros: [
      '古きものが目覚める！',
      '禁断の領域に足を踏み入れた！',
      '己の運命と向き合う時だ！',
      'ボスが君の小さな存在をあざ笑う。'
    ]
  }
};

export const DICTIONARY = {
  [Language.EN]: {
    ui: {
      title: 'Dungeon of the Basilisk',
      setup: 'Game Setup',
      numPlayers: 'Number of Players',
      grade: 'Class',
      grade_value: 'Class {grade}',
      selectLang: 'Language',
      start: 'Start Game',
      waiting: 'Waiting...',
      next: 'Next Turn',
      restart: 'Play Again',
      log: 'Game Log',
      event: 'Event',
      winner_is: 'Winner is',
      custom_assets: 'Custom Textures (Image URL)',
      asset_players: 'Players',
      asset_cells: 'Map Cells',
      url_placeholder: 'Paste image URL here...',
      retry_door: 'Retry Door',
      game_over_title: 'GAME OVER',
      locked_door_title: 'LOCKED DOOR',
      you: 'YOU',
      vs: 'VS',
      boss: 'BOSS',
      beast: 'BEAST',
      rps_rock: 'ROCK',
      rps_paper: 'PAPER',
      rps_scissors: 'SCISSORS',
      player_name: 'Player',
      cell_corridor: 'Corridor',
      cell_door: 'Door',
      cell_monster: 'Basilisk',
      cell_center: 'Boss Lair',
      cell_start: 'Start',
      cell_hidden: 'Hidden'
    },
    game: {
      turn: "It's turn for",
      roll: 'Roll Dice',
      rolled: 'Rolled:',
      move: 'Move',
      finish: 'finished!',
      fight_boss: 'FIGHT BOSS'
    },
    dice: {
      corridor: 'Corridor',
      door: 'Door',
      monster: 'Basilisk'
    },
    events: {
      centerReached: 'reached the Boss!',
      door_locked: 'Locked Door! Answer to pass.',
      monster_encounter: 'Basilisk! Rock-Paper-Scissors!',
      rps_win: 'You won! Safe.',
      rps_lose: 'You lost! Petrified (Skip Turn).',
      rps_draw: 'Draw! You survived.',
      quiz_correct: 'Correct! The door opens.',
      quiz_wrong: 'Wrong! You retreat to try again later.',
      petrified_skip: 'is petrified and skips this turn!',
      boss_fight: 'BOSS FIGHT!',
      boss_win_game: 'You defeated the Boss! VICTORY!',
      boss_lose_game: 'The Boss turned you to stone! You are eliminated.',
      boss_draw: 'Stalemate! The Boss waits for your next move.',
      game_over_loss: 'All players have been turned to stone. GAME OVER.'
    },
    logs: {
      game_started: 'Game started with {0} players.',
      retry_door_attempt: '{0} tries to open the door again...',
      path_clear: 'The path seems clear.'
    }
  },
  [Language.PL]: {
    ui: {
      title: 'Lochy Bazyliszka',
      setup: 'Konfiguracja Gry',
      numPlayers: 'Liczba Graczy',
      grade: 'Klasa',
      grade_value: 'Klasa {grade}',
      selectLang: 'Język',
      start: 'Rozpocznij Grę',
      waiting: 'Czekam...',
      next: 'Następna Tura',
      restart: 'Zagraj Ponownie',
      log: 'Dziennik',
      event: 'Zdarzenie',
      winner_is: 'Wygrywa',
      custom_assets: 'Własne Tekstury (URL Obrazka)',
      asset_players: 'Gracze',
      asset_cells: 'Pola Mapy',
      url_placeholder: 'Wklej URL obrazka...',
      retry_door: 'Spróbuj Ponownie',
      game_over_title: 'KONIEC GRY',
      locked_door_title: 'ZAMKNIĘTE DRZWI',
      you: 'TY',
      vs: 'KONTRA',
      boss: 'BOSS',
      beast: 'BESTIA',
      rps_rock: 'KAMIEŃ',
      rps_paper: 'PAPIER',
      rps_scissors: 'NOŻYCE',
      player_name: 'Gracz',
      cell_corridor: 'Korytarz',
      cell_door: 'Drzwi',
      cell_monster: 'Bazyliszek',
      cell_center: 'Legowisko Bossa',
      cell_start: 'Start',
      cell_hidden: 'Ukryte'
    },
    game: {
      turn: 'Tura gracza',
      roll: 'Rzuć Kostką',
      rolled: 'Wyrzucono:',
      move: 'Ruch',
      finish: 'ukończył grę!',
      fight_boss: 'WALCZ Z BOSSEM'
    },
    dice: {
      corridor: 'Korytarz',
      door: 'Drzwi',
      monster: 'Bazyliszek'
    },
    events: {
      centerReached: 'dotarł do Bossa!',
      door_locked: 'Zamknięte drzwi! Odpowiedz, aby przejść.',
      monster_encounter: 'Bazyliszek! Kamień-Papier-Nożyce!',
      rps_win: 'Wygrałeś! Bezpieczny.',
      rps_lose: 'Przegrałeś! Skamieniałeś (Tracisz turę).',
      rps_draw: 'Remis! Przeżyłeś.',
      quiz_correct: 'Poprawnie! Drzwi się otwierają.',
      quiz_wrong: 'Źle! Wycofujesz się, by spróbować później.',
      petrified_skip: 'jest skamieniały i traci turę!',
      boss_fight: 'WALKA Z BOSSEM!',
      boss_win_game: 'Pokonałeś Bossa! ZWYCIĘSTWO!',
      boss_lose_game: 'Boss zamienił cię w kamień! Odpadasz z gry.',
      boss_draw: 'Remis! Boss czeka na twój następny ruch.',
      game_over_loss: 'Wszyscy gracze zamienili się w kamień. KONIEC GRY.'
    },
    logs: {
      game_started: 'Gra rozpoczęta z {0} graczami.',
      retry_door_attempt: '{0} próbuje ponownie otworzyć drzwi...',
      path_clear: 'Droga wydaje się wolna.'
    }
  },
  [Language.UA]: {
    ui: {
      title: 'Підземелля Василіска',
      setup: 'Налаштування гри',
      numPlayers: 'Кількість гравців',
      grade: 'Клас',
      grade_value: 'Клас {grade}',
      selectLang: 'Мова',
      start: 'Почати гру',
      waiting: 'Чекаю...',
      next: 'Наступна Тура',
      restart: 'Грати Знову',
      log: 'Журнал',
      event: 'Подія',
      winner_is: 'Переможець',
      custom_assets: 'Власні Текстури (URL Зображення)',
      asset_players: 'Гравці',
      asset_cells: 'Клітинки Мапи',
      url_placeholder: 'Вставте URL зображення...',
      retry_door: 'Спробувати Ще',
      game_over_title: 'КІНЕЦЬ ГРИ',
      locked_door_title: 'ЗАМКНЕНІ ДВЕРІ',
      you: 'ТИ',
      vs: 'ПРОТИ',
      boss: 'БОС',
      beast: 'ЗВІР',
      rps_rock: 'КАМІНЬ',
      rps_paper: 'ПАПІР',
      rps_scissors: 'НОЖИЦІ',
      player_name: 'Гравець',
      cell_corridor: 'Коридор',
      cell_door: 'Двері',
      cell_monster: 'Василіск',
      cell_center: 'Лігво Боса',
      cell_start: 'Старт',
      cell_hidden: 'Приховано'
    },
    game: {
      turn: 'Хід гравця',
      roll: 'Кинути Кубик',
      rolled: 'Випало:',
      move: 'Хід',
      finish: 'закінчив гру!',
      fight_boss: 'БИТВА З БОСОМ'
    },
    dice: {
      corridor: 'Коридор',
      door: 'Двері',
      monster: 'Василіск'
    },
    events: {
      centerReached: 'досяг Боса!',
      door_locked: 'Замкнені двері! Відповідай, щоб пройти.',
      monster_encounter: 'Василіск! Камінь-Ножиці-Папір!',
      rps_win: 'Ти виграв! Безпечно.',
      rps_lose: "Ти програв! Скам'янів (Пропуск ходу).",
      rps_draw: 'Нічия! Ти вижив.',
      quiz_correct: 'Правильно! Двері відчиняються.',
      quiz_wrong: 'Неправильно! Ти відступаєш, щоб спробувати пізніше.',
      petrified_skip: "скам'янів і пропускає хід!",
      boss_fight: 'БИТВА З БОСОМ!',
      boss_win_game: 'Ти переміг Боса! ПЕРЕМОГА!',
      boss_lose_game: 'Бос перетворив тебе на камінь! Ти вибуваєш.',
      boss_draw: 'Нічия! Бос чекає на твій наступний хід.',
      game_over_loss: 'Усі гравці перетворилися на камінь. КІНЕЦЬ ГРИ.'
    },
    logs: {
      game_started: 'Гру розпочато з {0} гравцями.',
      retry_door_attempt: '{0} намагається відчинити двері знову...',
      path_clear: 'Шлях здається вільним.'
    }
  },
  [Language.RU]: {
    ui: {
      title: 'Подземелье Василиска',
      setup: 'Настройка Игры',
      numPlayers: 'Количество Игроков',
      grade: 'Класс',
      grade_value: 'Класс {grade}',
      selectLang: 'Язык',
      start: 'Начать Игру',
      waiting: 'Ожидание...',
      next: 'Следующий Ход',
      restart: 'Играть Снова',
      log: 'Журнал',
      event: 'Событие',
      winner_is: 'Победитель',
      custom_assets: 'Свои Текстуры (URL Изображения)',
      asset_players: 'Игроки',
      asset_cells: 'Клетки Карты',
      url_placeholder: 'Вставьте URL изображения...',
      retry_door: 'Попробовать Еще',
      game_over_title: 'ИГРА ОКОНЧЕНА',
      locked_door_title: 'ЗАПЕРТАЯ ДВЕРЬ',
      you: 'ТЫ',
      vs: 'ПРОТИВ',
      boss: 'БОСС',
      beast: 'ЗВЕРЬ',
      rps_rock: 'КАМЕНЬ',
      rps_paper: 'БУМАГА',
      rps_scissors: 'НОЖНИЦЫ',
      player_name: 'Игрок',
      cell_corridor: 'Коридор',
      cell_door: 'Дверь',
      cell_monster: 'Василиск',
      cell_center: 'Логово Босса',
      cell_start: 'Старт',
      cell_hidden: 'Скрыто'
    },
    game: {
      turn: 'Ход игрока',
      roll: 'Бросить Кубик',
      rolled: 'Выпало:',
      move: 'Ход',
      finish: 'закончил игру!',
      fight_boss: 'БОЙ С БОССОМ'
    },
    dice: {
      corridor: 'Коридор',
      door: 'Дверь',
      monster: 'Василиск'
    },
    events: {
      centerReached: 'достиг Босса!',
      door_locked: 'Запертая дверь! Ответь, чтобы пройти.',
      monster_encounter: 'Василиск! Камень-Ножницы-Бумага!',
      rps_win: 'Ты выиграл! Безопасно.',
      rps_lose: 'Ты проиграл! Окаменел (Пропуск хода).',
      rps_draw: 'Ничья! Ты выжил.',
      quiz_correct: 'Верно! Дверь открывается.',
      quiz_wrong: 'Неверно! Ты отступаешь, чтобы попробовать позже.',
      petrified_skip: 'окаменел и пропускает ход!',
      boss_fight: 'БИТВА С БОССОМ!',
      boss_win_game: 'Ты победил Босса! ПОБЕДА!',
      boss_lose_game: 'Босс превратил тебя в камень! Ты выбываешь.',
      boss_draw: 'Ничья! Босс ждет твоего следующего хода.',
      game_over_loss: 'Все игроки превратились в камень. ИГРА ОКОНЧЕНА.'
    },
    logs: {
      game_started: 'Игра началась с {0} игроками.',
      retry_door_attempt: '{0} пытается открыть дверь снова...',
      path_clear: 'Путь кажется свободным.'
    }
  },
  [Language.JA]: {
    ui: {
      title: 'バジリスクの地下迷宮',
      setup: 'ゲーム設定',
      numPlayers: 'プレイヤー数',
      grade: '学年',
      grade_value: '{grade}年',
      selectLang: '言語',
      start: 'ゲーム開始',
      waiting: '待機中...',
      next: '次のターン',
      restart: 'もう一度遊ぶ',
      log: 'ゲームログ',
      event: 'イベント',
      winner_is: '勝者',
      custom_assets: 'カスタムテクスチャ（画像URL）',
      asset_players: 'プレイヤー',
      asset_cells: 'マップセル',
      url_placeholder: '画像URLを貼り付け...',
      retry_door: '扉を再挑戦',
      game_over_title: 'ゲームオーバー',
      locked_door_title: '閉ざされた扉',
      you: 'あなた',
      vs: 'VS',
      boss: 'ボス',
      beast: '魔物',
      rps_rock: 'グー',
      rps_paper: 'パー',
      rps_scissors: 'チョキ',
      player_name: 'プレイヤー',
      cell_corridor: '通路',
      cell_door: '扉',
      cell_monster: 'バジリスク',
      cell_center: 'ボスの巣',
      cell_start: '開始',
      cell_hidden: '未探索'
    },
    game: {
      turn: 'ターン',
      roll: 'サイコロを振る',
      rolled: '出目:',
      move: '移動',
      finish: 'ゲームをクリア！',
      fight_boss: 'ボスと戦う'
    },
    dice: {
      corridor: '通路',
      door: '扉',
      monster: 'バジリスク'
    },
    events: {
      centerReached: 'ボスに到達した！',
      door_locked: '扉は閉ざされている！答えると通れる。',
      monster_encounter: 'バジリスク！じゃんけん勝負！',
      rps_win: '勝った！無事だ。',
      rps_lose: '負けた！石化した（1回休み）。',
      rps_draw: 'あいこ！生き延びた。',
      quiz_correct: '正解！扉が開く。',
      quiz_wrong: '不正解！あとで再挑戦するため退却する。',
      petrified_skip: '石化していて、このターンを休む！',
      boss_fight: 'ボス戦！',
      boss_win_game: 'ボスを倒した！勝利！',
      boss_lose_game: 'ボスに石へ変えられた！脱落だ。',
      boss_draw: '膠着状態！ボスは次の一手を待っている。',
      game_over_loss: '全員が石になった。ゲームオーバー。'
    },
    logs: {
      game_started: '{0}人でゲーム開始。',
      retry_door_attempt: '{0}はもう一度扉を開けようとしている...',
      path_clear: '道は安全そうだ。'
    }
  }
};
