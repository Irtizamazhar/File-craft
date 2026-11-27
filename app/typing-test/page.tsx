import type {Metadata} from 'next';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import TypingTest from '@/components/typing/TypingTest';
import WorkspaceHeader from '@/components/tool-workspace/WorkspaceHeader';
import Faq from '@/components/Faq';
import {ToolCard} from '@/components/ToolCard';
import {pageMetadata} from '@/lib/seo';
import {siteUrl} from '@/lib/site';
import {getTool,type Tool} from '@/lib/tools';
import './typing-focus.css';

const title='Free Typing Speed Test Online - WPM & Accuracy Checker';
const description='Take a free online typing speed test. Check your WPM and accuracy in 1-minute, timed, word and quote tests, with live stats and progress saved only on your device.';
const shareImage={url:'/og-typing-test.png',width:1200,height:630,alt:'Editgoo Typing Speed Test: WPM and accuracy checker'};
const base=pageMetadata({title,description,path:'/typing-test'});
export const metadata:Metadata={...base,openGraph:{...base.openGraph,images:[shareImage]},twitter:{card:'summary_large_image',title,description,images:[shareImage.url]}};

const faqs=[
  ['How is WPM calculated?','Every 5 characters you type, including spaces and punctuation, count as one word. Raw WPM is the characters in your typed text divided by 5 and by the minutes elapsed. Net WPM subtracts one word per minute for each mistake you left uncorrected. For example, 300 characters in 60 seconds is 60 raw WPM, and 10 uncorrected mistakes bring it to 50 net WPM.'],
  ['When does the timer start?','On the first character you type. Clicking or tapping the text only focuses it. Once started, the clock keeps running until the test ends: it does not pause if you stop typing, switch windows or hide the tab.'],
  ['What is the difference between accuracy and keystroke accuracy?','Accuracy compares the characters in your final text with the prompt, so a mistake you fixed with Backspace no longer counts against it. Keystroke accuracy counts every wrong key you pressed, even ones you later corrected. Both appear in your results.'],
  ['Why can’t I paste text into the test?','Pasted, dropped or auto-inserted text is not typing, so the test ignores it. Keyboard suggestions and autocorrect changes are ignored for the same reason. You can paste your own passage into the separate Custom text box to practise with it.'],
  ['Is my typing history stored?','Only in your browser on this device, using local storage. Nothing is uploaded to Editgoo and no account is needed. You can clear your history or reset your personal best at any time.'],
  ['Is this an official or certified typing test?','No. Results are calculated in your browser and are not independently verified. They are useful for practice and for tracking your progress, but they are not a certificate and may differ from the method an employer or exam uses.'],
  ['Does it work on a phone or tablet?','Yes. Tap the text to open your keyboard. For accurate results, turn off autocorrect and predictive text, and type one character at a time. Swipe typing and suggestion taps are not counted.'],
  ['Which languages are supported?','The test is currently available in English only.']
];

export default function TypingTestPage(){
  const related=['text-to-pdf','pdf-to-text','docx-to-txt'].map(slug=>getTool(slug)).filter((t):t is Tool=>!!t);
  const url=siteUrl+'/typing-test';
  const schema=[
    {'@context':'https://schema.org','@type':'WebApplication',name:'Editgoo Typing Speed Test',url,description,applicationCategory:'EducationalApplication',
      operatingSystem:'Any operating system with a modern web browser',browserRequirements:'Requires JavaScript',inLanguage:'en',isAccessibleForFree:true,
      offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},
      featureList:['Timed tests from 15 seconds to 5 minutes','Word-count and quote tests','Practice drills and custom text','Net WPM, raw WPM and accuracy','Speed graph and device-local progress history']},
    {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
      {'@type':'ListItem',position:1,name:'Home',item:siteUrl},{'@type':'ListItem',position:2,name:'All tools',item:siteUrl+'/tools'},{'@type':'ListItem',position:3,name:'Typing Speed Test',item:url}]}
  ];
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>
    <div data-typing-extra=""><WorkspaceHeader title="Typing Speed Test"/></div>
    <section className="typing-test-section">
      <div className="container">
        <p className="typing-test-lede" data-typing-extra="">Check your typing speed, WPM and accuracy.</p>
        <TypingTest/>
      </div>
    </section>

    <div data-typing-extra="">
      <section className="simple-section typing-guide">
        <div className="container guide-layout">
          <article className="guide-article">
            <h2>What is a typing speed test?</h2>
            <p>A typing speed test measures how quickly and how accurately you can type a piece of text. You type a prompt for a fixed time or until you reach the end, and the test turns your keystrokes into a speed in words per minute (WPM) and an accuracy percentage. Because every result uses the same rules, you can compare your scores over time and see whether your practice is working.</p>

            <h2>How It Works</h2>
            <ol>
              <li>Choose a mode: <strong>Time</strong> (15 seconds to 5 minutes), <strong>Words</strong> (10 to 100 words), <strong>Quote</strong> (a short, medium or long passage), <strong>Practice</strong> drills or your own <strong>Custom text</strong>.</li>
              <li>Click or tap the text. The timer does not start yet.</li>
              <li>Type the text exactly as shown. The timer starts with your first character, the caret shows where you are, and wrong characters turn red and underlined.</li>
              <li>Fix mistakes with Backspace if you want to; uncorrected mistakes lower your net speed.</li>
              <li>When the time runs out or you finish the text, read your results and the speed graph. Press <kbd>Esc</kbd> to try the same text again or <kbd>Ctrl</kbd>+<kbd>Enter</kbd> for a new one.</li>
            </ol>

            <details className="typing-scoring">
            <summary>How scoring works</summary>
            <h3>What does WPM mean?</h3>
            <p>WPM stands for words per minute. Real words have very different lengths, so typing tests use a standard word of <strong>5 characters</strong>, counting letters, numbers, punctuation and spaces alike. Typing “the cat sat” plus a space is 12 characters, or 2.4 standard words. This makes a result fair whether the text is full of short words or long ones.</p>

            <h3>How WPM is calculated</h3>
            <p>Editgoo uses the standard gross and net WPM formulas, with time measured by your browser’s high-resolution clock rather than by counting timer ticks:</p>
            <ul>
              <li><strong>Raw (gross) WPM</strong> = characters in your typed text ÷ 5 ÷ elapsed minutes.</li>
              <li><strong>Net WPM</strong> = raw WPM − (uncorrected mistakes ÷ elapsed minutes), and never below zero.</li>
            </ul>
            <p>Example: in a 60-second test you type 300 characters. That is 300 ÷ 5 ÷ 1 = <strong>60 raw WPM</strong>. If 10 of those characters are still wrong at the end, net WPM is 60 − 10 ÷ 1 = <strong>50 WPM</strong>. Backspace, Shift, arrow keys and other non-character keys are never counted as typed characters, and characters you delete are not part of your typed text.</p>

            <h3>Gross vs net WPM</h3>
            <p>Gross (raw) WPM shows how fast your fingers move, mistakes included. Net WPM is the speed of usable text: each uncorrected mistake costs one word per minute. If your raw speed is much higher than your net speed, slowing down slightly and making fewer mistakes will usually raise your real score faster than trying to type quicker.</p>

            <h3>How typing accuracy works</h3>
            <p><strong>Accuracy</strong> is the share of characters in your final text that match the prompt. A mistake you correct no longer counts against it. <strong>Keystroke accuracy</strong> is stricter: it is the share of all character keys you pressed that were right the first time, so corrected mistakes still count. Your results also list corrected and uncorrected mistakes separately, so you can see whether you tend to fix errors or leave them behind.</p>

            </details>
            <h2>Tips to improve typing speed</h2>
            <ul>
              <li>Keep your fingers on the home row (ASDF and JKL;) and return to it after each key.</li>
              <li>Look at the screen, not the keyboard. It feels slower at first but pays off within days.</li>
              <li>Aim for 95% accuracy or better before you push for speed.</li>
              <li>Practise for 10 to 15 minutes a day rather than for an hour once a week.</li>
              <li>Use the Practice drills for your weak spots: numbers, punctuation or capital letters.</li>
              <li>Sit upright, keep your wrists straight and take short breaks to avoid strain.</li>
            </ul>

            <h2>1-minute typing test</h2>
            <p>The 60-second test is the most common way to measure typing speed, and it is the default here. One minute is long enough to smooth out a lucky or unlucky start, yet short enough to repeat several times in a session. Choose 15 or 30 seconds for a quick warm-up, or 2 and 5 minutes to measure your stamina over longer stretches.</p>

            <h2>Typing test for students and job preparation</h2>
            <p>Many courses and office roles expect comfortable keyboard skills, and some employers run their own typing assessment. Practising with a range of text types, including numbers and punctuation, helps you prepare for real writing work. This test is a practice and self-assessment tool: it does not issue certificates, and an employer’s or exam’s own test may use different texts, rules or scoring.</p>
          </article>
          <aside className="guide-aside">
            <h2>Scoring at a glance</h2>
            <p>1 word = 5 characters, including spaces.</p>
            <p>Net WPM = raw WPM − uncorrected mistakes per minute.</p>
            <p>The timer starts on your first character and never pauses.</p>
            <p>Practice and custom-text results never count towards your personal best.</p>
            <Link href="/tools">Browse all tools →</Link>
          </aside>
        </div>
      </section>
      <Faq items={faqs}/>
      <section className="related-section">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow">KEEP GOING</span><h2>Work with your text.</h2></div><Link href="/tools" className="inline-link">View all tools <ArrowRight size={17}/></Link></div>
          <div className="tool-grid">{related.map(t=><ToolCard key={t.slug} tool={t}/>)}</div>
        </div>
      </section>
    </div>
  </>;
}
