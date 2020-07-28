require('dotenv').config()
const Telegraf = require('telegraf')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const AnyCase = require('telegraf-anycase-commands')
const WizardScene = require('telegraf/scenes/wizard')
const { leave } = Stage
const axios = require('axios')
const mongoose = require('mongoose')
const { TelegrafMongoSession } = require('telegraf-session-mongodb')
//const { MongoClient } = require('mongodb')

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PORT = process.env.PORT || 3000;
const URL = process.env.URL || 'https://roy-leader-school.herokuapp.com';

let msg = {}
let notify = []
let local = 'ru'

const connection = mongoose.connect(`mongodb+srv://${process.env.DBUSER}:${process.env.DBPASSWORD}@${process.env.DBNAME}.mongodb.net/stay_away?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useCreateIndex', true)
mongoose.set('useFindAndModify', false)

const db = mongoose.connection
const Games = require('./models/games');
const Sessions = require('./models/session');
const Cards = require('./cards');

const maxCost = 90
const maxTime = 120
const maxPlayers = 12
const minPlayers = 4

const header = 'AgACAgQAAxkDAAIBOV6c-a9W55WH4t5cSy-wTNNMB3CWAAJEqzEbgMjsUKkovlWBSlbe_jF8I10AAwEAAwIAA3gAAzRwAAIYBA'
const rules = [  
  /*{ type:'photo', media: 'AgACAgQAAxkDAAM3XpzDNHkJD_h0RnZFe-MQCVQgqPcAAqeqMRssxOxQyVpgBkqf15YjlbcbAAQBAAMCAANtAAPKtQUAARgE'}, */
  { type:'photo', media: 'AgACAgQAAxkDAAM5XpzDNEX6sxg-lMS6j83ZGlpq7WgAAgOrMRvu3OxQTtuUAjP8a-nqJbYbAAQBAAMCAANtAANaswUAARgE'}, 
  { type:'photo', media: 'AgACAgQAAxkDAAM4XpzDNFUzplomVsb1h6Fxa7VyOq0AAkerMRv0fexQ4x1-u5lxciGLgd0iXQADAQADAgADbQAD3_gAAhgE'}, 
  { type:'photo', media: 'AgACAgQAAxkDAAM2XpzDNOHL-ivfi5OoS3Cz-SkkMRAAAlKrMRtH1-xQYBpzWrBgjyujx88iXQADAQADAgADbQADr_0AAhgE'}, 
  { type:'photo', media: 'AgACAgQAAxkDAAM0XpzDNG6q8h0VESJr8P94Mnk2UKUAAgWrMRtBsexQpBqBLVmbnKImsd4hXQADAQADAgADbQADS-oCAAEYBA'}, 
  { type:'photo', media: 'AgACAgQAAxkDAAM1XpzDNGHy_1M_TA--gG7A6CdR1vsAAj2rMRtcSOxQuhGi5zNp_8lYcvciXQADAQADAgADbQADRP4AAhgE'}, 
  { type:'photo', media: 'AgACAgQAAxkDAAM6XpzDNgv8xJJaqBgQdp8x9qTtSYIAAmGrMRtQV-xQ-VFABSF2peAo-PgiXQADAQADAgADbQADcP4AAhgE'}, 
  { type:'photo', media: 'AgACAgQAAxkDAAM7XpzDOJgMkaYJk4ZmhExDfBF9b0IAAg-rMRsPku1QIdlS0Q7xFbKERLYbAAQBAAMCAANtAAPysQUAARgE'}
]

//const mainDescription = `«Нечто» из глубокой бездны! Телеграм-бот адаптация настольной игры. Игра от 4х до 12 человек. Ознакомьтесь с правилами, позовите друзей и начинайте играть!"`
const mainDescription = ``

const createRoomDescription = `В игровой комнате можно настроить параметры: 

1) <b>Открытая/закрытая</b> - присоединиться к игре может кто угодно или только игроки по ссылке-приглашению.

2) <b>Бесплатная/на BIP</b> - ставка в BIP, которая спишется у всех игроков. 💰 Призовой фонд разделит победившая команда/игроки.

3) <b>Чат открыт/без чата</b> - разговоры между участниками в боте разрешены/запрещены.

4) <b>Режим игры:</b>
  🧠 Безумный ("Нечто" изначально в колоде)
  👻 Стандартный (Обычные правила)
  ☠️ Месть (Игра на выбывание)

5) <b>Время на ход</b> - для более быстрой игры, участник не успевший сделать ход получает один пропуск хода, в следующий раз выбывает, если он не является <b>«Нечто»</b>.

6) <b>Желаемое количество игроков.</b> Вы можете не собирать до конца команду и пойти играть раньше, проведя голосование в своей комнате (появлется в комнате, как только наберется 4 участника)
`

const rulesDescription = `<b>Выше в ${rules.length} изображениях - полные правила настольной игры «Нечто»</b>

В телеграм адаптации многие моменты автоматизированы, но механика игры полностью сохранена. Так что, чтобы вникнуть в суть игры, достаточно прочитать <b>страницы с 6 по 9</b>.

Возможные действия и события написаны на игровых карточках, а всю рутину возьмет на себя <b>игровой бот</b>!`

const aboutDescription = `Бот создан, чтобы не скучать на COVID-19 карантине :)

Для начала прочитайте правила, или освежите знания правил игры, если когда-то играли.

Потом создайте комнату или вступите в уже существующую. Для начала желательно выбирать комнаты со стандартным вариантом игры, размером 4-6 человек, с временем хода по 80-120 секунд и открытым чатом для общения. 

Если вы вступили в комнату, то можете написать сообщение прямо в бот и он перешлет его другим участникам этой комнаты. Так вы можете договориться о старте или обсудить что-нибудь еще :)

По опыту первая пара игр дается не легко. Не совсем понятно, что нужно делать за те или иные роли, или как и когда применять конкретные карты. Но в дальнейшем просыпается интерес и понимание множества вариантов механики игры.

Я выбрал эту игру не только из за связи с карантином. Она мне показалась наиболее реализуемой в рамках телеграма. В боте исчезают такие проблемы настольной версии игры, как необходимость пересаживаться с места на место, тщательно перемешивать карты, готовить карты к раздаче, соблюдать за исполнением некоторых жестких правил игры и прочие моменты.

По всем вопросам/предложениям и чему либо еще - @Salcez

Донаты можно присылать сюда :)
<pre>Mx09e4f7559762ee545e50fef86a718d55326532e0</pre>
`

const roomDescription = (game) => ''

//const roomsDescription = `В данный момент доступны комнаты:`
const roomsDescription = ``

const mainKeyboard = Extra.HTML().markup((m) =>
  m.inlineKeyboard([
    [m.callbackButton('Создать игру', 'create_room')],
    [m.callbackButton('Присоединиться', 'rooms')],
    [m.callbackButton('Дай мне карты!', 'cards')],
    [m.callbackButton('Симуляция хода!', 'turn')],
    [m.callbackButton('Правила игры', 'rules')],
    [
      m.callbackButton('Настройки', 'settings'),
      m.callbackButton('О боте', 'about'),
    ]
  ]))

const to_menu = Extra.HTML().markup((m) =>
  m.inlineKeyboard([
    [
      m.callbackButton('Вернуться в меню', 'menu'),
    ]
  ]))

const to_extra = (keyboard) => {
  return { reply_markup: { 'inline_keyboard': keyboard } }
}

const newRoomKeyboard = (settings) => Extra.HTML().markup(Markup.inlineKeyboard([
  [
    Markup.callbackButton(settings.lock ? '🔒 Закрытая' : '🔓 Открытая', 'set_lock'),
    Markup.callbackButton(settings.cost > 0 ? `Ⓜ️ На ${settings.cost} BIP` : '👌 Бесплатная', 'set_cost')
  ], [
    Markup.callbackButton(settings.silence ? '🤫 Чат закрыт' : '💬 Чат открыт', 'set_silence'),
    Markup.callbackButton(settings.mode == 1 ? '🧠 Безумный' : (settings.mode == 2 ? '🧟‍♂️ Стандарт' : '☠️ Месть'), 'set_mode')
  ], [
    Markup.callbackButton(`⏱ ${settings.time} сек на ход`, 'set_time'),
    Markup.callbackButton(`👤 ${settings.players} игроков`, 'set_players'),
  ], [
    Markup.callbackButton('Назад', 'back'),
    Markup.callbackButton('Создать комнату', 'set_room'),
  ]
]))

const roomsKeyboard = (rooms, id) => {
  return Extra.HTML().markup((m) => {
    let list = []
    list.push([m.callbackButton('Обновить', 'rooms')])

    rooms.forEach(room => {
      let isMember = room.members.filter(obj => obj.chat_id == id).length > 0
      let row = (isMember ? '✅ ' : '') +
        ('👤 ' + (room.members.length ? room.members.length : 0) + '/' + room.settings.players) + ' ' +
        (room.settings.mode == 1 ? '🧠 ' : (room.settings.mode == 2 ? '🧟‍♂️ ' : '☠️ ')) + 
        (room.settings.time + 'с ') +
        (room.settings.silence ? '🤫 ' : '💬 ') + 
        (room.creatorName ? room.creatorName : room.creator) + 
        (room.settings.cost > 0 ? ' Ⓜ️' + room.settings.cost : '')

      list.push([m.callbackButton(row, 'show_room_' + room._id)])
    })
      
    list.push([m.callbackButton('Назад', 'back')])
    return m.inlineKeyboard(list)
  })
}

const currentGame = (game, id) => {
  let isAuthor = game.creator == id
  let isMember = game.members.filter(obj => obj.chat_id == id).length > 0

  return Extra.HTML().markup((m) => {
    let list = []
    let row = []
    
    row.push(m.callbackButton(game.settings.cost > 0 ? game.settings.cost + 'Ⓜ️' : '', 'fake_cost'))
    row.push(m.callbackButton(game.settings.silence ? '🤫' : '💬', 'fake_silence'))
    row.push(m.callbackButton(game.settings.mode == 1 ? '🧠' : (game.settings.mode == 2 ? '🧟‍♂️' : '☠️'), 'fake_mode'))
    row.push(m.callbackButton(game.settings.time + 'с', 'fake_time'))
    row.push(m.callbackButton(game.members.length + '/' + game.settings.players + '👤', 'fake_players'))
    if(isAuthor && game.members.length == 0)
      row.push(m.callbackButton('❌', 'delete_room_' + game._id))

    list.push(row)

    if(game.members.length > 0)
      list.push([m.callbackButton('Обновить', 'show_room_' + game._id), m.callbackButton('🕹 Созвать игроков!', 'vote_room_' + game._id)])
    else
      list.push([m.callbackButton('Обновить', 'show_room_' + game._id)])

    game.members.forEach( member => {
      list.push([
        m.urlButton((member.name ? member.name : '') + (member.username ? ' @' + member.username : member.chat_id), 't.me/' + member.username)
      ])
    })
    let empty_spaces = game.settings.players - game.members.length

    if(empty_spaces > 0)
      for (var i = empty_spaces - 1; i >= 0; i--) {
        list.push([m.switchToChatButton('Свободное место', game._id)])
      }

    let bottomRow = []
    bottomRow.push(m.callbackButton('К комнатам', 'rooms'))
    if(!isMember) {
      bottomRow.push(m.callbackButton('🤝 Зайти в игру', 'join_room_' + game._id))
    } else if(isMember) {
      bottomRow.push(m.callbackButton('👋 Не учавствовать', 'left_room_' + game._id))
    }

    list.push(bottomRow)
    list.push([m.callbackButton('В главное меню', 'back')])
    return m.inlineKeyboard(list)
  })
}

const getRandom = (max) => Math.floor(Math.random() * Math.floor(max))

const makeUsersFree = (game) => {
  Sessions
    .updateMany(
      { 'data.user_room': game._id }, 
      { $unset: { 'data.user_room': 1 } }
    )
    .catch(e => console.log(e))
}

// mainMenu
const mainMenu = new Scene('mainMenu')
mainMenu.enter(ctx => {
  ctx.replyWithPhoto(header, mainKeyboard.load({ caption: mainDescription }))
})

/* Правила */
mainMenu.action('rules', async ctx => {
  await ctx.deleteMessage()
  await ctx.replyWithMediaGroup(rules, Extra.load({ caption: mainDescription }))
  ctx.session.read_rules = true
  await ctx.replyWithPhoto(header, to_menu)
})

/*  О боте */
mainMenu.action('about', async ctx => {
  await ctx.deleteMessage()
  ctx.replyWithHTML(aboutDescription, to_menu)
})

/* Вернутьcя в меню */
mainMenu.action('menu', async ctx => {
  await ctx.deleteMessage()
  await ctx.replyWithPhoto(header, mainKeyboard.load({ caption: mainDescription }))
})

mainMenu.action('settings', async ctx => {
  ctx.answerCbQuery('Этого раздела пока что нет :(')
})

/* Создать комнату */
mainMenu.action('create_room', async ctx => {
  console.log(ctx.session)
  if(ctx.session.read_rules)  
    if(!ctx.session.user_room) {
      if(!ctx.session.new_room)
        ctx.session.new_room = {
          lock: false,
          cost: 0,
          silence: false,
          mode: 1,
          time: 15,
          players: 4
        }
      ctx.editMessageCaption(createRoomDescription, newRoomKeyboard(ctx.session.new_room))
    } else {
      ctx.answerCbQuery('Нельзя создавать/учавствовать в нескольких играх одновременно!')
    }
  else
    ctx.answerCbQuery('Вы не ознакомились с правилами игры!')
})
mainMenu.action('set_lock', async ctx => {
  ctx.session.new_room.lock = !ctx.session.new_room.lock
  ctx.editMessageCaption(createRoomDescription, newRoomKeyboard(ctx.session.new_room))
})
mainMenu.action('set_cost', async ctx => {
  ctx.session.new_room.cost = ctx.session.new_room.cost < maxCost ? ctx.session.new_room.cost + 15 : 0
  ctx.editMessageCaption(createRoomDescription, newRoomKeyboard(ctx.session.new_room))
})
mainMenu.action('set_silence', async ctx => {
  ctx.session.new_room.silence = !ctx.session.new_room.silence
  ctx.editMessageCaption(createRoomDescription, newRoomKeyboard(ctx.session.new_room))
})
mainMenu.action('set_mode', async ctx => {
  ctx.session.new_room.mode = ctx.session.new_room.mode < 3 ? ctx.session.new_room.mode+1 : 1
  ctx.editMessageCaption(createRoomDescription, newRoomKeyboard(ctx.session.new_room))
})
mainMenu.action('set_time', async ctx => {
  ctx.session.new_room.time = ctx.session.new_room.time < maxTime ? ctx.session.new_room.time + 15 : 15
  ctx.editMessageCaption(createRoomDescription, newRoomKeyboard(ctx.session.new_room))
})
mainMenu.action('set_players', async ctx => {
  ctx.session.new_room.players = ctx.session.new_room.players < maxPlayers ? ctx.session.new_room.players + 1 : minPlayers
  ctx.editMessageCaption(createRoomDescription, newRoomKeyboard(ctx.session.new_room))
})
mainMenu.action('set_room', async ctx => {
  // Записываем в бд
  const newGame = new Games({
    creator: ctx.from.id,
    creatorName: ctx.from.username ? '@' + ctx.from.username : ctx.from.first_name,
    members: [
      { 
        chat_id: ctx.from.id,
        username: ctx.from.username,
        name: ctx.from.first_name
      }
    ],
    settings: ctx.session.new_room,
    created: new Date()
  })

  await newGame.save().then(async game => {
    ctx.session.user_room = game._id.toString()
    await ctx.editMessageCaption(roomDescription(game), currentGame(game, ctx.from.id))
  }).catch(e => console.log(e))
  
})
mainMenu.action('back', async ctx => {
  ctx.editMessageCaption(mainDescription, mainKeyboard)
})

/* Просмотр всех комнат */
mainMenu.action('rooms', async ctx => {
  Games
    .find()
    .limit(10)
    .sort({'createdAt': -1})
    .select('creator creatorName members settings created createdAt')
    .then(rooms => {
      if(rooms.length)
        ctx.editMessageCaption(roomsDescription, roomsKeyboard(rooms, ctx.from.id)).catch(e => e.code == 400 ? ctx.answerCbQuery('Ничего не изменилось с прошлого обновления!') : null)
      else
        ctx.answerCbQuery('На данный момент нет свободных комнат! Создайте свою!')
    })
})

/* Просмотр комнаты */
mainMenu.action(/show_room_(.+)/, ctx => {
  Games
    .findById(ctx.match[1])
    .select('creator creatorName members settings created createdAt')
    .then(game => {      
      ctx.editMessageCaption(roomDescription(game), currentGame(game, ctx.from.id))
      .catch(e => e.code == 400 ? ctx.answerCbQuery('Ничего не изменилось с прошлого обновления!') : null)
    })
    .catch(e => { console.log(e); ctx.answerCbQuery('Похоже этой комнаты больше не существует!')})
})

/* Сообщения */
mainMenu.action('fake_cost', ctx => {
  ctx.answerCbQuery('Тут показана стоимость игры в криптовалюте BIP.')
})
mainMenu.action('fake_players', ctx => {
  ctx.answerCbQuery('Максимальное количество игроков в комнате.')
})
mainMenu.action('fake_time', ctx => {
  ctx.answerCbQuery('Время на ход для каждого игрока.')
})
mainMenu.action('fake_mode', ctx => {
  ctx.answerCbQuery('Режим игры: 🧠 - Безумный 👻 - Стандартный  ☠️ Месть')
})
mainMenu.action('fake_silence', ctx => {
  ctx.answerCbQuery('Общение между игроками: 💬 - Разрешено 🤫 - Запрещено')
})

/* Добавление игрока в комнату */
mainMenu.action(/join_room_(.+)/, async ctx => {
  if(ctx.session.read_rules)
    await Games
      .findById(ctx.match[1])
      .select('creator creatorName members settings created createdAt')
      .then(async game => {
        if(game.members.length === game.settings.players)
          return ctx.answerCbQuery('Нет свободных мест в этой комнате!')  

        /*game.members.push({
          chat_id: ctx.from.id,
          username: ctx.from.username,
          name: ctx.from.first_name
        })*/
        game.members.push({
          chat_id: ctx.from.id,
          username: ctx.from.username,
          name: getRandom(34343) + ' ' + ctx.from.first_name
        })

        await game.save()
          .then(updated => {
            ctx.session.user_room = updated._id.toString()
            ctx.editMessageCaption(roomDescription(updated), currentGame(updated, ctx.from.id)).catch(e => console.error(e.code))
          })
          .catch(e => console.log(e))
      })
      .catch(e => ctx.answerCbQuery('Похоже этой комнаты больше не существует!'))
  else
    ctx.answerCbQuery('Вы не ознакомились с правилами игры!')
})

/* Выйти из игровой комнаты */
mainMenu.action(/left_room_(.+)/, async ctx => {
  await Games
    .findById(ctx.match[1])
    .select('creator creatorName members settings created createdAt')
    .then(async game => {
      game.members = game.members.filter(member => member.chat_id != ctx.from.id)
      await game
        .save()
        .then(updated => {
          delete ctx.session['user_room']
          ctx.editMessageCaption(roomDescription(updated), currentGame(updated, ctx.from.id)).catch(e => console.error(e.code))
        })
        .catch(e => console.log(e))
    })
    .catch(e => ctx.answerCbQuery('Похоже этой комнаты больше не существует!'))
})

/* Начать голосование */
mainMenu.action(/vote_room_(.+)/, ctx => {
  console.log('vote_room')
  Games
    .findById(ctx.match[1])
    .select('creator creatorName members settings created createdAt')
    .then(game => {
      console.log(game)
      ctx.replyWithPoll('Начинаем играть?', [
          'Да, я готов', 
          'Подождите пару минут',
          'Смогу только в течении 10 минут',
          'Извините, пока занят 20+',
          'Нужно подождать еще игроков'
        ],
        { is_anonymous: false }
      ).then(poll => {
        game.members.forEach(member => {
          if(member.chat_id !== ctx.from.id)
            ctx.telegram.forwardMessage(member.chat_id, ctx.from.id, poll.message_id)
              .then(r => console.log(r))
              .catch(e => console.log(e))  
        })
      }).catch(e => console.log(e))
    })
    .catch(e => ctx.answerCbQuery('Похоже этой комнаты больше не существует!'))
})
mainMenu.on('poll_answer', (ctx) => ctx.reply('Poll answer' + ctx.pollAnswer.toString()))
mainMenu.action(/delete_room_(.+)/, async ctx => {
  if(ctx.session.delete_action > 2) {
    await Games.deleteOne({ _id: ctx.match[1] })
      .then(r => {
        ctx.answerCbQuery('Комната удалена!')
        ctx.editMessageCaption(mainDescription, mainKeyboard)
        ctx.session.delete_action = 0
        makeUsersFree(ctx.match[1])
      })
      .catch(e => ctx.answerCbQuery('Не смогли найти комнату!'))
  } else {
    ctx.session.delete_action = typeof ctx.session.delete_action !== 'undefined' ? parseInt(ctx.session.delete_action+1) : 1
    ctx.answerCbQuery('Удалить комнату? Нажмите на кнопку ❌ еще ' + (4-ctx.session.delete_action) + ' раз(а)!')
  }
})
mainMenu.on('message', (ctx, next) => {
  console.log(ctx.message)
  if(ctx.session.user_room && (ctx.message.text || ctx.message.sticker || ctx.messsage.photo) && !ctx.message.entities) {
    Games
      .findById(ctx.session.user_room)
      .select('members')
      .then(game => {
        game.members.forEach(member => {
          if(member.chat_id !== ctx.from.id)
            //ctx.telegram.forwardMessage(member.chat_id, ctx.from.id, ctx.message.message_id)
            ctx.telegram.forwardMessage(399509, ctx.from.id, ctx.message.message_id)
              .then(r => console.log(r))
              .catch(e => console.log(e))
        })
      })
  } else {
    console.log('Не состоит в комнатах')
    console.log(ctx.session.user_room)
    return next()
  }
})



// Scenes
const stage = new Stage()

stage.register(mainMenu)

stage.command('cancel', leave())

// Command and ohter
const bot = new Telegraf(BOT_TOKEN)
AnyCase.apply(bot)
let session
bot.use((...args) => session.middleware(...args))
bot.use(stage.middleware())

bot.use((ctx, next) => {
  const start = new Date();
  if(ctx.updateType !== 'poll_answer') {
    console.log(ctx.updateType + ' ' + ctx.from.username || ctx.from.first_name, ': ', ctx.message ? ctx.message.text : ctx.updateType )  
    if (ctx.session && !ctx.session.id) {
        ctx.session.key = `${ctx.chat.id}:${ctx.from.id}`
        ctx.session.id = ctx.from.id
        ctx.session.username = ctx.from.username
        ctx.session.first_name = ctx.from.first_name
        ctx.session.last_name = ctx.from.last_name
        ctx.session.language_code = ctx.from.language_code
        ctx.session.is_bot = ctx.from.is_bot
        ctx.session.io = []
    }
    return next().then(() => {
      const ms = new Date() - start
      console.log('response time %sms', ms)
    })
  }
})

const turnInlineKeyboard = (ctx) => {
  let buttons = []
  buttons.push(Markup.callbackButton(ctx.session.game.mode ? '► Сыграть карту ◄' : 'Сыграть карту', 'change_action_mode'))
  buttons.push(Markup.callbackButton(ctx.session.game.mode ? 'Сбросить карту' : '► Сбросить карту ◄', 'change_action_mode'))
  
  ctx.session.game.cards.forEach(card => {
    if((ctx.session.game.mode && card.type == 'action') || 
      (!ctx.session.game.mode && card.type != 'infection') ||
      (!ctx.session.game.mode && !ctx.session.game.infected && card.type == 'infection'))
      buttons.push(
        Markup.callbackButton(
          `"${card.name}"`, 
          (ctx.session.game.mode ? 'play_card_' : 'drop_card_') + card.id)
        )

  })
  
  const wrapFn = (btn, index, currentRow) => currentRow.length >= 2
  let currentRow = []
  let index = 0
  const result = []
  for (const btn of buttons.filter((button) => !button.hide)) {
    if (wrapFn(btn, index, currentRow) && currentRow.length > 0) {
      result.push(currentRow)
      currentRow = []
    }
    currentRow.push(btn)
    index++
  }
  if (currentRow.length > 0) {
    result.push(currentRow)
  }


  //list.push([m.callbackButton('Назад', 'back')])
  
  console.log(result)
  return result
}

const random_item = (items) => items[Math.floor(Math.random()*items.length)]

const turn = async (ctx) => {

  let random_card = random_item(Cards.filter(card => card.players <= 5))
  console.log(random_card)

  if(!ctx.session.game.cards) {
    ctx.session.game.cards = []
    while (ctx.session.game.cards.length !== 4) {
      let card = Cards[getRandom(110)]
      if(card.type !== 'panic')
        ctx.session.game.cards.push(card)
    } 
  }


  if(random_card.type == 'panic') {
    //Сообщить всем что выпала паника
    await ctx.replyWithPhoto(random_card.media, to_extra(turnInlineKeyboard(ctx, ctx.session.game.cards)))
  } else {
    ctx.session.game.cards.unshift(random_card)
  }

  await ctx.replyWithMediaGroup(ctx.session.game.cards.map((card) => {return { 'type': 'photo', 'media': card.media }}))
  let cards = ctx.session.game.cards.reduce((acc, val) => `${acc}<b>${val.name}</b> - ${val.description}\n\n`, '')
  await ctx.replyWithHTML(cards, to_extra(turnInlineKeyboard(ctx, ctx.session.game.cards)))
}

bot.action('change_action_mode', async (ctx) => {
  ctx.session.game.mode = !ctx.session.game.mode
  ctx.editMessageReplyMarkup({
      inline_keyboard: turnInlineKeyboard(ctx, ctx.session.game.cards)
  })
})

bot.action(/play_card_(.+)/, async (ctx) => {
  ctx.session.game.cards = ctx.session.game.cards.filter(card => card.id != ctx.match[1])
  await turn(ctx)
})

bot.action(/drop_card_(.+)/, async (ctx) => {
  ctx.session.game.cards = ctx.session.game.cards.filter(card => card.id != ctx.match[1])
  await turn(ctx)
})

bot.action('turn', async (ctx) => {
  ctx.session.game = {}
  await turn(ctx)
})

bot.command('turn', async (ctx) => {
  ctx.session.game = {}
  await turn(ctx)
})


const cards = async (ctx) => {
  let hand = []
  while (hand.length !== 4) {
    let card = Cards[getRandom(110)]
    console.log(card)
    if(card.type !== 'panic' && card.type !== 'infection')
      hand.push(card)
  }
  await ctx.replyWithMediaGroup(hand.map((card) => {return { 'type': 'photo', 'media': card.media }}))
  let cards = hand.reduce((acc, val) => `${acc}<b>${val.name}</b> - ${val.description}\n\n`, '')
  let cardsKeyboard = Extra.HTML().markup((m) => {
    let list = []
    hand.forEach(card => {
      if(card.type == 'action')
        list.push(m.callbackButton(card.name, 'play_card_' + card.id))
    })
    //list.push([m.callbackButton('Назад', 'back')])
    return m.inlineKeyboard(list)
  })
  await ctx.replyWithHTML(cards, cardsKeyboard)
}

bot.action('cards', async (ctx) => {
  await cards(ctx)
})

bot.command('cards', async (ctx) => {
  await cards(ctx)
})

bot.command('kick', async (ctx) => {
  Games
    .findOne({ creator:ctx.from.id })
    .select('creator creatorName members settings created createdAt')
    .then(game => {
      console.log(game)
      if(game) {
        ctx.replyWithPhoto(header, Extra.HTML().markup((m) => {
          let list = []
          game.members.forEach(member => {
            list.push([
              m.callbackButton((member.name ? member.name : '') + (member.username ? ' @' + member.username : member.chat_id), 'kick_user_' + member.chat_id)
            ])
          })
          list.push([m.callbackButton('В главное меню', 'back')])
          return m.inlineKeyboard(list)
        }))
      } else {
        ctx.reply('У вас нет созданных игр!')
      }
    })
})

bot.action(/kick_user_(.+)/, (ctx) => {
  Games
    .findOne({ creator:ctx.from.id })
    .select('creator creatorName members settings created createdAt')
    .then(game => {
      game.members = game.members.filter(member => member.chat_id != ctx.match[1])
      game
        .save()
        .then(updated => {
          
          //ctx.session.user_room = false

          ctx.editMessageCaption('Выберите игрока, которого хотите исключить из своей комнаты:', Extra.HTML().markup((m) => {
            let list = []
            updated.members.forEach(member => {
              list.push([
                m.callbackButton((member.name ? member.name : '') + (member.username ? ' @' + member.username : member.chat_id), 'kick_user_' + member.chat_id)
              ])
            })
            return m.inlineKeyboard(list)
          }))
          ctx.replyWithPhoto(header, currentGame(updated, ctx.from.id).load({ caption: roomDescription(updated) }))
        })
        .catch(e => console.log(e))
    })
    .catch(e => ctx.answerCbQuery('Похоже этой комнаты больше не существует!'))
})

bot.start( async (ctx) => {
  console.log('start')
  if(ctx.startPayload)
    Games
      .findById(ctx.startPayload)
      .select('creator creatorName members settings created createdAt')
      .then(game => ctx.replyWithPhoto(header, currentGame(game, ctx.from.id)))
      .catch(e => ctx.reply('Похоже этой комнаты больше не существует!'))
  else 
    ctx.scene.enter('mainMenu')
})

bot.on("inline_query", async ctx => {
  let gameId = ctx.update.inline_query.query
  Games
    .findById(gameId)
    .select('creator creatorName members settings created createdAt')
    .then(game => {
      ctx.answerInlineQuery([{
        id: 1,
        type: 'article',
        title: 'Пригласить в игру',
        input_message_content: {
          message_text: ctx.from.first_name || ctx.from.username + " приглашает в комнату"
        },
        reply_markup: {
          inline_keyboard: [
            [{
              text: 'Войти в комнату',
              url: 't.me/stay_away_game_bot?start=' + gameId,
             }]
          ]
        } 
      }],{
        is_personal: true,
        cache_time: 0,
      })
    })
    .catch(e => {
      ctx.answerInlineQuery([{
        id: 2,
        type: 'article',
        title: 'Нет такой игры!',
        input_message_content: {
          message_text: 'Зайдите в бот @stay_away_game_bot и создайте новую игру!'
        }
      }]);
    })
});

bot.settings(async (ctx) => {
  await ctx.setMyCommands([
    {
      command: '/start',
      description: 'Открыть основное меню'
    },
    {
      command: '/kick',
      description: 'Исключить игрока из комнаты'
    },
    {
      command: '/report',
      description: 'Пожаловаться на игрока'
    },
    {
      command: '/cancel',
      description: 'Завершить и выйти из игры'
    }
  ])
  return ctx.reply('Ok')
})

bot.help(async (ctx) => {
  const commands = await ctx.getMyCommands()
  const info = commands.reduce((acc, val) => `${acc}/${val.command} - ${val.description}\n`, '')
  return ctx.reply(info)
})

bot.on('dice', (ctx) => ctx.reply(`Value: ${ctx.message.dice.value}`))

// bot.on('message', (ctx) => ctx.telegram.sendCopy(ctx.chat.id, ctx.message, Extra.markup(keyboard)))


// Все прочее
bot.use((ctx) => {
  ctx.replyWithHTML(`<b>${ctx.from.first_name}</b>: ${ctx.text}`)
})

bot.action('delete', ({ deleteMessage }) => deleteMessage())

bot.catch(error => {
  console.log('telegraf error', error.response, error.parameters, error.on || error)
})

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {

  Games.countDocuments({})
    .then((r) => {
      console.log('Игр всего: ' + r)
    })
    .catch((e) => {
      console.log(e)
    })
  
  session = new TelegrafMongoSession(db, {
    collectionName: 'sessions',
    sessionName: 'session'
  })

  if(session) {
    if (process.env.WEBHOOKS === 'true') {
        bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`)
        bot.startWebhook(`/bot${BOT_TOKEN}`, null, PORT)
    } else {
        bot.telegram.deleteWebhook()
        bot.startPolling()
    }
    /*bot.telegram.sendMessage(399509, 'Bot is up and running!')*/
  } else {
    console.log('Session error!');
  }
})
