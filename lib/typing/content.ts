/**
 * Typing Speed Test content: original English word lists, sentences and passages written for Editgoo,
 * plus deterministic generators. No imports, so unit tests can load it directly.
 * The content is keyed by language so more languages can be added later; only English exists today.
 */

export type Difficulty='easy'|'medium'|'hard';
export type QuoteLength='short'|'medium'|'long';
export type Drill='common'|'sentences'|'numbers'|'punctuation'|'capitals'|'mixed';
export type Passage={id:string;length:QuoteLength;text:string};
export type LanguagePack={
  code:string;label:string;
  words:Record<Difficulty,readonly string[]>;
  contractions:readonly string[];
  capitalized:readonly string[];
  acronyms:readonly string[];
  sentences:readonly string[];
  passages:readonly Passage[];
};

const split=(text:string)=>text.trim().split(/\s+/);

const easy=split(`the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an
will my one all would there their what so up out if about who get which go me when make can like time no just him know take people
into year your good some could them see other than then now look only come its over think also back after use two how our work first
well way even new want because any these give day most us is was are has had did made said find long down call may part sun dog cat
red big run sit top cup hat map pen box car bus job hand home room door book food road tree fish bird rain snow wind park shop desk
tea milk cake ball game song name city town farm lake hill sea ship baby girl boy king hope help play read walk talk sing swim open
keep turn move live feel hear stay wait ask try show tell bring hold stand learn grow begin start stop pay buy send meet sleep cook`);

const medium=split(`about after again almost always answer around before began being below better between bring build
change chance choose circle clean clear close cloud colour corner country course cover create danger decide describe different
dinner direct distance during early easily enough equal every example family famous father field final follow forest forward
friend garden gather gentle global govern ground group happen health heavy history holiday house however idea important include
island journey kitchen language large later laugh leader letter listen little machine market measure middle minute modern moment
morning mother mountain music nature never notice number object office often orange order paper parent pattern people picture
planet plant pocket position possible power practice prepare present problem produce promise public question quickly quiet reason
record remember report result return river second section select sentence serve settle shape simple single sister smile special
spring square station steady story strong student study subject summer surface system table teacher thought together travel
twenty under until usual valley village visit water weather window winter without wonder world write yellow young answer bright
carry common gentle level matter method normal plain proper rather reach shadow signal source stream supply useful weekend
wooden yesterday balance basket camera career coffee comfort credit device energy engine finish handle invite ladder lesson
manage memory narrow online option outside parcel pepper player pocket purple rocket saddle sample screen simple ticket tunnel`);

const hard=split(`accommodate achievement acknowledge acquisition adjustment administration advertisement algorithm alternative
ambiguous analysis anticipate appreciate approximately architecture atmosphere authority automatically availability bureaucracy
calculation catastrophe characteristic circumstance collaborate commitment communicate comparison competitive comprehensive
concentrate configuration consequence considerable consistency contemporary contribution controversial convenience correspondence
curriculum deliberately demonstrate dependable description development dictionary difficulty discipline distinguish documentation
effectiveness efficiency elaborate embarrass encyclopedia enthusiasm environment equipment establishment exaggerate examination
exceptional experience experiment explanation extraordinary facilitate familiarity fluorescent fundamental generation guarantee
hierarchy hypothesis identification illustration immediately implementation independence infrastructure inevitable innovation
instrument intelligence interpretation investigation irrelevant jeopardy knowledgeable laboratory legislation maintenance
manufacture mathematics mechanism millennium miscellaneous necessary negotiation neighbourhood nevertheless observation occasionally
occurrence opportunity organization parliament particularly perseverance perspective phenomenon philosophy photograph possession
precisely preference preparation privilege procedure professional pronunciation psychology questionnaire recommendation reference
relationship relevant reliability representative responsibility restaurant rhythm satisfactory schedule significance sophisticated
specification spontaneous statistics strengths substantial successful sufficient surveillance susceptible technique temperature
thoroughly throughout transformation transparent unnecessary vocabulary vulnerable warehouse whereabouts`);

const contractions=split(`don't can't won't isn't it's I'm you're we're they're that's there's let's didn't doesn't wasn't
couldn't shouldn't wouldn't haven't I've we've you'll I'd`);

const capitalized=split(`Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July
August September October November December London Paris Tokyo Cairo Lima Oslo Delhi Nairobi Sydney Toronto Madrid Seoul Dublin
Lisbon Rome Berlin Mexico Brazil Canada Egypt Kenya Japan India Spain Italy Peru Chile Norway Ireland Europe Africa Asia English
Spanish Arabic Atlantic Pacific Amazon Nile Everest Sahara Mars Venus Jupiter Earth Sarah James Maria Omar Lucas Aisha Daniel
Priya Tom Elena Kwame Yuki Noah Fatima Leo Grace Ali`);

const acronyms=split('PDF USB HTML CPU GPS FAQ ID TV UK EU UN DNA CEO PIN SMS URL RAM API');

const sentences=[
  // Beginner
  'The cat sat in the sun by the door.','We like to walk in the park after lunch.','My bag is on the chair near the desk.',
  'She has a red cup and a blue plate.','The bus stops at the end of our road.','He reads a short book before bed.',
  'It is cold today, so wear a warm coat.','The dog ran fast to get the ball.','We had rice and soup for dinner.',
  'Please close the window when it rains.','The shop opens at nine every morning.','Our class starts again next week.',
  // Everyday English
  'I left my keys on the kitchen table again this morning.','The bakery on the corner sells fresh bread until noon.',
  'We planted tomatoes, beans and herbs along the garden fence.','My sister called to say her train would be a little late.',
  'A short walk after dinner helps me clear my head.','The weather changed quickly, and the picnic moved indoors.',
  'He keeps a notebook in his pocket for ideas and lists.','The library extended its opening hours during exam season.',
  'Children waved from the windows as the parade passed by.','She painted the old bookshelf a bright shade of green.',
  'The neighbours share tools, recipes and the occasional cake.','Remember to water the plants before you leave for the weekend.',
  'The river was calm enough for a slow afternoon of rowing.','A good pair of shoes makes a long day much easier.',
  // Workplace writing
  'Please review the attached report and share your comments by Friday.','The meeting has moved to Room 4 because of the training session.',
  'Thank you for your quick reply; the updated figures look correct.','Our team will publish the new schedule at the end of the month.',
  'Could you confirm the delivery address before we send the order?','The project is on track, although two tasks need more time.',
  'Customer feedback helped us simplify the checkout process.','Let me know if you need any further details about the proposal.',
  'We have updated the policy to make the approval steps clearer.','The quarterly budget includes funds for new equipment and training.',
  'Please keep a copy of the signed form for your own records.','The interview panel will meet each candidate for thirty minutes.',
  'I have attached the slides from this morning\'s presentation.','Every request is logged so that nothing slips through the cracks.',
  // Technology
  'Back up important files before you install a major update.','A strong password is long, unique and hard to guess.',
  'The app saves your progress locally, so it works without a connection.','Restart the router if the network feels unusually slow.',
  'Clear labels and good contrast make a website easier to use.','The new laptop charges quickly and stays cool under heavy load.',
  'Developers test each change before it reaches real users.','Cloud storage keeps documents in sync across several devices.',
  'A spreadsheet can turn a long list of numbers into a clear chart.','Two-step verification adds an extra layer of account security.',
  'The browser blocked the pop-up and showed a small warning icon.','Software updates often fix security problems as well as bugs.',
  'Large photos load faster after they are resized and compressed.','The keyboard shortcut saves time when you repeat the same task.'
] as const;

const P=(id:string,length:QuoteLength,text:string):Passage=>({id,length,text});
const passages:Passage[]=[
  P('s1','short','Small habits, repeated every day, often matter more than big plans that never begin.'),
  P('s2','short','The best way to learn a new skill is to practise a little, rest, and then practise again.'),
  P('s3','short','A clear message saves time for everyone, so write the important point first.'),
  P('s4','short','Morning light filled the quiet kitchen while the kettle began to whistle.'),
  P('s5','short','Good tools do not do the work for you, but they make the work easier to finish.'),
  P('s6','short','Typing quickly is useful, yet typing accurately is what keeps you from starting over.'),
  P('s7','short','The trail climbed slowly through the pines until the whole valley opened below us.'),
  P('s8','short','Ask one more question before you decide; it often reveals what you missed.'),
  P('s9','short','Every expert was once a beginner who kept going after the first difficult week.'),
  P('s10','short','A tidy desk will not solve every problem, but it does make the next step easier to see.'),
  P('s11','short','Rain tapped on the roof all night, and by morning the garden looked brand new.'),
  P('s12','short','Keep your eyes on the text, relax your hands, and let your fingers find the keys.'),
  P('m1','medium','Learning to type without looking at the keyboard feels slow at first. Your fingers hesitate, and you make more mistakes than you expect. After a week of short daily sessions, however, the movements start to feel natural, and your speed rises without any extra effort.'),
  P('m2','medium','The old train station had been empty for years before the town turned it into a library. The ticket hall became a reading room, the platforms became a garden, and the clock above the entrance was repaired so that it could keep time once again.'),
  P('m3','medium','When you write an email to a busy colleague, put the request in the first sentence. Add only the details they need to act, and finish with a clear deadline. A short, specific message is far more likely to receive a quick and helpful reply.'),
  P('m4','medium','A good recipe is really a set of small decisions. You choose the freshest vegetables, cut them to a similar size, and cook them in the right order. Taste as you go, adjust the salt, and remember that patience often matters more than any secret ingredient.'),
  P('m5','medium','Modern phones hold an amazing amount of information, from family photos to work documents. Because of that, it is worth spending a few minutes to set a screen lock, turn on automatic backups, and remove apps that you no longer use or trust.'),
  P('m6','medium','The volunteers arrived early on Saturday with gloves, bags and plenty of coffee. By noon they had cleared the beach of plastic, counted every bottle for a local survey, and shared a simple lunch while the tide slowly came back in.'),
  P('m7','medium','Many people believe they need a perfect plan before they can start a project. In practice, a rough first version teaches you far more than a perfect plan ever could. Build something small, show it to others, and improve it one step at a time.'),
  P('m8','medium','The museum opened a new gallery about the history of maps. Visitors can compare hand-drawn charts from sailors with satellite images taken from space, and they quickly notice how much our view of the world has changed over the centuries.'),
  P('m9','medium','A comfortable workspace helps you type for longer without strain. Keep your wrists straight, rest your feet flat on the floor, and place the top of the screen near eye level. Short breaks every half hour help your hands and eyes recover.'),
  P('m10','medium','On the first warm evening of spring, the whole street seemed to come outside. Neighbours repaired bicycles, children drew chalk pictures on the pavement, and someone carried a small radio to the front steps so that everyone could hear the music.'),
  P('l1','long','Most people can double their typing speed with steady practice, but the improvement rarely comes from trying to move faster. It comes from accuracy. Each time you stop to correct a mistake, you lose the rhythm that makes typing feel easy. Begin by typing slowly enough that almost every word is correct, and let your fingers return to the home row after each key. Within a few weeks, the correct movements become automatic, and speed follows naturally. Measure your progress once or twice a week rather than after every session, because a single result can be affected by tiredness, a new keyboard or an unfamiliar passage.'),
  P('l2','long','The small island had only one road, one shop and one ferry that arrived twice a day. Visitors often expected to feel bored, yet most of them left wishing they could stay longer. In the mornings they walked along the cliffs to watch seabirds diving for fish. In the afternoons they borrowed books from the tiny library in the old school building, and in the evenings they joined the islanders at the harbour, where stories were shared as the light faded. Without traffic or crowds, time seemed to stretch, and simple pleasures, such as a warm cup of tea or a long conversation, felt surprisingly important.'),
  P('l3','long','Writing clear instructions is harder than it looks. The writer already knows how the task works, so it is easy to skip steps that seem obvious. A useful test is to hand the instructions to someone who has never done the task and watch where they hesitate. Every pause points to a missing detail, an unclear word or a step in the wrong order. Number the steps, start each one with an action, and describe what the reader should see when the step is complete. Good instructions save time for everyone, prevent costly mistakes and help new team members feel confident on their very first day.'),
  P('l4','long','Behind every website you visit is a long chain of computers working together in a fraction of a second. When you type an address, your device asks a directory service where the site lives, then opens a secure connection to a server that may be thousands of kilometres away. The server prepares the page, sends it back in small pieces, and your browser assembles text, images and styles into the screen you see. If any link in the chain is slow, the whole page feels slow, which is why engineers spend so much effort making each step lighter, faster and more reliable.'),
  P('l5','long','Gardening teaches patience in a way few other hobbies can. You plant a seed, water it, and then wait for days with nothing to show for your effort. Some seeds never appear at all, while others grow faster than you expected and need support before they topple over. Over a season you learn which corners of the garden stay damp, which plants attract bees, and which ones the snails find first. By the end of summer, the harvest may be modest, yet the knowledge you gain makes next year easier, and the quiet routine of caring for living things becomes its own reward.'),
  P('l6','long','A good meeting begins long before anyone enters the room. The organiser decides what the meeting must achieve, invites only the people who can help, and shares any reading material a day in advance. During the meeting, someone keeps track of the time and gently returns the discussion to the agenda when it drifts. Decisions are written down as they are made, together with the name of the person responsible and a realistic date. Afterwards, a short summary reaches everyone who attended, so that nobody has to rely on memory, and the next meeting can start exactly where this one finished.')
];

export const languages:Record<string,LanguagePack>={
  en:{code:'en',label:'English',words:{easy,medium,hard},contractions,capitalized,acronyms,sentences,passages}
};
export const defaultLanguage='en';
export function getLanguage(code=defaultLanguage):LanguagePack{return languages[code]??languages[defaultLanguage]}

/** Small deterministic PRNG so "Restart" can recreate exactly the same prompt from its seed. */
export function createRng(seed:number){
  let a=seed>>>0;
  return ()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296};
}
export function randomSeed(){
  try{const buffer=new Uint32Array(1);globalThis.crypto.getRandomValues(buffer);return buffer[0]}catch{return Math.floor(Math.random()*4294967295)}
}

type Rng=()=>number;
const pick=<T,>(rng:Rng,list:readonly T[]):T=>list[Math.floor(rng()*list.length)];
const capitalize=(word:string)=>word.charAt(0).toUpperCase()+word.slice(1);

function numberToken(rng:Rng,rich:boolean){
  const roll=rng();
  if(!rich||roll<0.45)return roll<0.25?String(Math.floor(rng()*10)):String(Math.floor(rng()*9990)+10);
  if(roll<0.6)return String(1950+Math.floor(rng()*80));
  if(roll<0.72)return (Math.floor(rng()*99)+1)+'.'+String(Math.floor(rng()*100)).padStart(2,'0');
  if(roll<0.84)return (Math.floor(rng()*99)+1)+'%';
  if(roll<0.93)return (Math.floor(rng()*12)+1)+':'+String(Math.floor(rng()*12)*5).padStart(2,'0');
  return '$'+(Math.floor(rng()*500)+1);
}

export type StreamOptions={difficulty:Difficulty;punctuation:boolean;numbers:boolean;capitals?:boolean;numberRate?:number;punctuationRate?:number};

/** An endless, seeded stream of prompt words. Calling next() repeatedly continues the same sequence. */
export function createWordStream(seed:number,options:StreamOptions,language=getLanguage()){
  const rng=createRng(seed);
  const list=language.words[options.difficulty];
  const numberRate=options.numberRate??(options.numbers?0.15:0);
  const punctuationRate=options.punctuationRate??1;
  let sentenceLeft=0,newSentence=true,last='';
  function word(){
    let w:string;
    do{w=pick(rng,list)}while(w===last&&list.length>1);
    last=w;
    if(options.punctuation&&rng()<0.06*punctuationRate)w=pick(rng,language.contractions);
    if(options.capitals){const r=rng();if(r<0.12)w=pick(rng,language.capitalized);else if(r<0.17)w=pick(rng,language.acronyms);else if(r<0.45)w=capitalize(w)}
    if(numberRate&&rng()<numberRate)w=numberToken(rng,options.punctuation);
    return w;
  }
  function next(count:number):string[]{
    const out:string[]=[];
    for(let i=0;i<count;i++){
      let w=word();
      if(options.punctuation){
        if(newSentence){w=capitalize(w);sentenceLeft=5+Math.floor(rng()*9);newSentence=false}
        sentenceLeft--;
        if(sentenceLeft<=0){const r=rng();w+=r<0.7?'.':r<0.85?'?':'!';newSentence=true}
        else{
          const r=rng()/punctuationRate;
          if(r<0.1)w+=',';else if(r<0.12)w+=';';else if(r<0.14)w+=':';
          else if(r<0.16)w='"'+w+'"';else if(r<0.18)w='('+w+')';else if(r<0.2)w+='-'+pick(rng,list);
        }
      }
      out.push(w);
    }
    return out;
  }
  return {next};
}

/** Endless shuffled sentences from the sentence bank, returned word by word. */
export function createSentenceStream(seed:number,language=getLanguage()){
  const rng=createRng(seed);
  let queue:string[]=[];
  function refill(){
    const order=[...language.sentences];
    for(let i=order.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
    queue.push(...order.flatMap(s=>s.split(' ')));
  }
  return {next(count:number){while(queue.length<count)refill();const out=queue.slice(0,count);queue=queue.slice(count);return out}};
}

export function createDrillStream(seed:number,drill:Drill,difficulty:Difficulty,language=getLanguage()){
  switch(drill){
    case 'sentences':return createSentenceStream(seed,language);
    case 'numbers':return createWordStream(seed,{difficulty:'easy',punctuation:false,numbers:true,numberRate:0.55},language);
    case 'punctuation':return createWordStream(seed,{difficulty:'medium',punctuation:true,numbers:false,punctuationRate:2},language);
    case 'capitals':return createWordStream(seed,{difficulty:'medium',punctuation:false,numbers:false,capitals:true},language);
    case 'mixed':return createWordStream(seed,{difficulty:difficulty==='easy'?'medium':difficulty,punctuation:true,numbers:true,capitals:true},language);
    default:return createWordStream(seed,{difficulty:'easy',punctuation:false,numbers:false},language);
  }
}

/** Pick a passage of the requested length, avoiding the one just typed when possible. */
export function pickPassage(seed:number,length:QuoteLength,avoidId?:string,language=getLanguage()):Passage{
  const pool=language.passages.filter(p=>p.length===length);
  const options=pool.length>1?pool.filter(p=>p.id!==avoidId):pool;
  return options[Math.floor(createRng(seed)()*options.length)];
}

export const CUSTOM_MIN_CHARS=20;
export const CUSTOM_MAX_CHARS=3000;
export const CUSTOM_MIN_WORDS=4;

/** Clean pasted custom text into a single typable line, or explain why it can't be used. */
export function prepareCustomText(raw:string):{ok:true;text:string}|{ok:false;error:string}{
  const text=raw.normalize('NFC')
    .replace(/[​-‍⁠﻿]/g,'')
    .replace(/[‘’‚ʼ′]/g,"'").replace(/[“”„″]/g,'"')
    .replace(/[–—−]/g,'-').replace(/…/g,'...')
    .replace(/[\s  -   　]+/g,' ')
    .trim();
  if(!text)return {ok:false,error:'Add some text to practise with.'};
  if(text.length<CUSTOM_MIN_CHARS)return {ok:false,error:`Use at least ${CUSTOM_MIN_CHARS} characters (you have ${text.length}).`};
  if(text.length>CUSTOM_MAX_CHARS)return {ok:false,error:`Use at most ${CUSTOM_MAX_CHARS.toLocaleString('en-US')} characters (you have ${text.length.toLocaleString('en-US')}).`};
  const unsupported=[...new Set(text.match(/[^\x20-\x7e]/g)??[])];
  if(unsupported.length)return {ok:false,error:`Remove characters that are not on a standard English keyboard: ${unsupported.slice(0,8).join(' ')}`};
  const words=text.split(' ').filter(w=>/[a-z0-9]/i.test(w));
  if(words.length<CUSTOM_MIN_WORDS)return {ok:false,error:`Use at least ${CUSTOM_MIN_WORDS} words.`};
  const compact=text.replace(/ /g,'');
  const counts=new Map<string,number>();
  for(const c of compact.toLowerCase())counts.set(c,(counts.get(c)??0)+1);
  if(Math.max(...counts.values())/compact.length>0.5||new Set(words.map(w=>w.toLowerCase())).size<2)
    return {ok:false,error:'This text repeats the same characters or word. Use a real sentence or paragraph.'};
  if((compact.match(/[a-z0-9]/gi)?.length??0)<compact.length*0.5)return {ok:false,error:'Use text that is mostly letters and numbers.'};
  return {ok:true,text};
}
