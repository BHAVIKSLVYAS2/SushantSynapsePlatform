import {cast} from './cast.mjs';
// Original fictional scripts, kept off voting-page module graphs.
const scripts=[
 {
  "id": "roar-nab",
  "persona": [
   "One question. Six guests. No survivors of the sound check.",
   "Dada runs a debate like a pressure cooker with a theme tune. He asks you to speak, interrupts to explain how much he wants you to speak, then thanks the nation for listening. The studio has six microphones, but five are decorative. His only quiet moment is sponsored by a commercial break.",
   "Surround-sound confidence",
   "The question that answers itself",
   "A mute button kept strictly for guests",
   [
    "You have thirty seconds. I will explain them for twenty-nine.",
    "Please stop interrupting my interruption.",
    "We are a panel of six. I speak for all seven of us."
   ]
  ],
  "backstage": {
   "scene": [
    "Sound engineer: Shall I lower the volume?",
    "Dada: Why are you trying to silence the nation?"
   ],
   "spotted": "Testing the acoustics of an already empty room.",
   "weakness": "A guest who completes a sentence.",
   "comeback": "My indoor voice is in a different constituency.",
   "encore": [
    "My microphone has its own microphone.",
    "This is a discussion. Your answer is optional.",
    "The commercial break asked me to let it finish."
   ]
  }
 },
 {
  "id": "ravish-reflection",
  "persona": [
   "He brought a question. The studio brought excuses.",
   "Sahay can make a room uncomfortable without increasing the electricity bill. He asks one ordinary question, adjusts his glasses and waits until the teleprompter starts looking guilty. His notebook contains three questions, seventeen unanswered follow-ups and a shopping list nobody has dared to address.",
   "Deadpan patience",
   "The pause after the polite question",
   "A notebook that remembers everything",
   [
    "Take your time. The question has already renewed its lease.",
    "I asked about the streetlight. We have reached ancient history.",
    "That was a beautiful answer to a question I did not ask."
   ]
  ],
  "backstage": {
   "scene": [
    "Producer: Can we add dramatic music?",
    "Sahay: Let the unanswered question do its job."
   ],
   "spotted": "Waiting beside the one question everyone walked past.",
   "weakness": "An answer that actually answers.",
   "comeback": "We can return to the subject whenever the subject returns.",
   "encore": [
    "I have underlined the question. It was feeling neglected.",
    "The silence is now eligible for a panel fee.",
    "We will take a short break from avoiding the point."
   ]
  }
 },
 {
  "id": "sudhir-studio",
  "persona": [
   "A missing stapler. A forty-minute special.",
   "Tiwari believes a story has not happened until it has three red banners and a rotating graphic. A missing office stapler becomes The Great Stationery Question. By the time the stapler is found, the studio has built a timeline, a hologram and a sequel. The ticker continues its investigation.",
   "Permanent urgency",
   "The seven-layer graphic reveal",
   "A red banner with no off switch",
   [
    "We have seven graphics and half a headline.",
    "The stapler has been found. The special continues.",
    "This exclusive is also exclusively available on our other screen."
   ]
  ],
  "backstage": {
   "scene": [
    "Producer: Nothing has happened today.",
    "Tiwari: Then why has nobody explained that in 3D?"
   ],
   "spotted": "Standing dramatically beside an unnecessarily large screen.",
   "weakness": "A headline that fits on one line.",
   "comeback": "We have simplified the issue into twelve simultaneous boxes.",
   "encore": [
    "Please remain calm while the banner flashes DO NOT PANIC.",
    "Our correspondent is live from the graphics department.",
    "The red alert is about the shortage of red alerts."
   ]
  }
 },
 {
  "id": "anjana-awaaz",
  "persona": [
   "Tonight, the panel debates whose turn it is.",
   "Poonam conducts a studio orchestra in which every instrument is a car horn. She says one at a time with the determination of someone announcing a railway platform change. Every guest gets equal time to complain about not getting equal time. The only perfectly balanced thing is her cup of chai.",
   "Order in the uproar",
   "The six-way split-screen stare",
   "A stopwatch that has stopped believing",
   [
    "One at a time, said all six guests together.",
    "You will get your turn after the debate about your turn.",
    "The panel is balanced. The volume meter has resigned."
   ]
  ],
  "backstage": {
   "scene": [
    "Guest: Can I finish?",
    "Poonam: Certainly. Everyone else, explain why he cannot."
   ],
   "spotted": "Trying to make eye contact with six boxes at once.",
   "weakness": "A panel that agrees before the opening music ends.",
   "comeback": "I can see your hand. So can the other five hands.",
   "encore": [
    "We invited a neutral chair. It has taken a side.",
    "The green room was quieter before we added guests.",
    "Tonight we ask: who interrupted the first interruption?"
   ]
  }
 },
 {
  "id": "rajat-ruling",
  "persona": [
   "You may sit. Your eyebrows will stand trial.",
   "Uncle turns a cushioned studio chair into the most nervous piece of furniture on television. He asks a perfectly pleasant question, smiles, and produces a follow-up that the guest thought was safely buried under the welcome speech. Even the coffee arrives prepared to clarify its position.",
   "Velvet-glove mischief",
   "The smiling follow-up",
   "A pen that says just one more thing",
   [
    "Your next answer may be used in the next promo.",
    "The chair is comfortable. The question is not.",
    "The court will rise after these messages."
   ]
  ],
  "backstage": {
   "scene": [
    "Guest: Is this an interview or a hearing?",
    "Uncle: The sofa prefers not to comment."
   ],
   "spotted": "Rearranging the guest chair by one suspicious centimetre.",
   "weakness": "A guest who has read the follow-up question.",
   "comeback": "Let us ask that again, but without the speech.",
   "encore": [
    "The commercial break has filed for an adjournment.",
    "Please answer in your own words. Fewer of them, ideally.",
    "The witness has requested a softer cushion and a harder question."
   ]
  }
 },
 {
  "id": "rubika-rapid",
  "persona": [
   "We are out of time. She has just begun.",
   "Disha can fit three closing arguments into the space normally reserved for goodbye. The producer waves, the credits roll, the next programme begins, and she is still saying one final question. Her stopwatch runs on suspense. Her guests now bring overnight bags.",
   "Last-minute lightning",
   "The final-final follow-up",
   "A closing bell on permanent snooze",
   [
    "We are out of time, except for my last three questions.",
    "Your one-word answer requires a brief explanation from me.",
    "The final word has applied for an extension."
   ]
  ],
  "backstage": {
   "scene": [
    "Producer: The next show has started.",
    "Disha: Excellent. My question will have a larger audience."
   ],
   "spotted": "Asking one last thing outside the lift.",
   "weakness": "A producer with the courage to roll the credits.",
   "comeback": "Very briefly: begin at the beginning.",
   "encore": [
    "This goodbye is a two-part special.",
    "We will continue after the break, and after the next break.",
    "The clock is a suggestion. My follow-up is confirmed."
   ]
  }
 },
 {
  "id": "king-khanvas",
  "persona": [
   "A doorway is just a railway platform without ambition.",
   "Badshah cannot enter a room until someone checks the wind direction. He once opened his arms at a tea stall and accidentally welcomed three buses, a wedding procession and the delivery man. The background violinist now follows him to the parking lot. Nobody remembers who ordered the chai.",
   "Dimple-powered drama",
   "The arms-wide arrival",
   "A wind machine with emotional needs",
   [
    "I ordered cutting chai. Why is the violinist crying?",
    "Give me a doorway. I will give you an interval.",
    "The queue was for tickets. I thought it was a love story."
   ]
  ],
  "backstage": {
   "scene": [
    "Director: Just walk through the door.",
    "Badshah: Is the door emotionally ready?"
   ],
   "spotted": "Making sustained eye contact with a slowly departing train.",
   "weakness": "A ceiling fan set to practical instead of romantic.",
   "comeback": "Wait. The scarf has not delivered its performance.",
   "encore": [
    "Even my parking ticket has a romantic subplot.",
    "The wind machine and I are taking some space.",
    "My arms are open. The lift doors are not."
   ]
  }
 },
 {
  "id": "salman-slowmo",
  "persona": [
   "Normal speed is a supporting actor.",
   "Sultan measures distance in background beats. A trip from the vanity van to the set needs two jacket flicks, a sunglasses close-up and a patient assistant with a lunch box. The director called action at nine. His left foot is expected after the interval. The right foot has a cameo.",
   "Unhurried swagger",
   "The three-replay walk-in",
   "Sunglasses with a stunt double",
   [
    "The film is two hours. My entrance is being negotiated separately.",
    "Please hold the door. The slow motion has not caught up.",
    "My sunglasses got a bigger trailer than the villain."
   ]
  ],
  "backstage": {
   "scene": [
    "Assistant: Sir, we are late.",
    "Sultan: Then play the late-arrival music."
   ],
   "spotted": "Halfway between the entrance and the entrance replay.",
   "weakness": "A door that closes at normal speed.",
   "comeback": "We can hurry after the close-up.",
   "encore": [
    "The lift reached the floor before my eyebrow did.",
    "The walk is short. The background score is ambitious.",
    "My stunt double handles the fast walking."
   ]
  }
 },
 {
  "id": "aamir-again",
  "persona": [
   "The eyebrow needs a stronger backstory.",
   "Ratan spent six months preparing to play a man waiting for chai. He interviewed the kettle, changed the cup and asked whether the steam understood its motivation. Everyone applauded the final take. He asked them to applaud again, with more emotional continuity. The chai is now a documentary.",
   "Microscopic dedication",
   "The almost-final adjustment",
   "A script annotated on both sides of the cover",
   [
    "One more take. This time the eyebrow has motivation.",
    "I researched the role of the person ordering chai.",
    "The final draft is a very promising first attempt."
   ]
  ],
  "backstage": {
   "scene": [
    "Director: Perfect. Print it.",
    "Ratan: Define perfect. The cup blinked."
   ],
   "spotted": "Discussing character development with an extra in the third row.",
   "weakness": "A take nobody can find anything wrong with.",
   "comeback": "I like it. Let us discover why in the next take.",
   "encore": [
    "The rehearsal needs a rehearsal.",
    "I lost weight for the interval and gained it back for the credits.",
    "The background tree has not committed to the scene."
   ]
  }
 },
 {
  "id": "akshay-action",
  "persona": [
   "Breakfast. Backflip. Has anyone seen the sun?",
   "Arjun reaches the set before the watchman has finished dreaming about opening it. By breakfast he has climbed a wall, chased a helicopter and politely asked whether the meeting could include a small explosion. His rest day has a warm-up. His alarm clock is trying to unionise.",
   "Pre-breakfast momentum",
   "The sunrise stunt",
   "An alarm clock wearing running shoes",
   [
    "The sun is late. I have already done the warm-up.",
    "Is there a stunt version of this meeting?",
    "I finished the chase scene. Your tea is still steeping."
   ]
  ],
  "backstage": {
   "scene": [
    "Assistant: It is a rest day.",
    "Arjun: Great. Where is the rest-day obstacle course?"
   ],
   "spotted": "Doing lunges while the opening credits load.",
   "weakness": "A meeting that could have been a chase scene.",
   "comeback": "We can discuss it on the way down from the helicopter.",
   "encore": [
    "My snooze button does push-ups.",
    "The stunt coordinator asked me to slow down during breakfast.",
    "I have an early night planned. It begins at 6 a.m."
   ]
  }
 },
 {
  "id": "deepika-drama",
  "persona": [
   "Some entrances need a wider red carpet.",
   "Sitara can make looking out of a window feel like the final scene of a trilogy. She once waved casually and three photographers changed lenses, a stylist adjusted the weather and a nearby curtain discovered its purpose. Her dramatic pause has a separate call sheet. The carpet waits for her opinion.",
   "Cinematic composure",
   "The award-worthy pause",
   "A spotlight with excellent attendance",
   [
    "Please hold. My close-up is still making an entrance.",
    "This is my casual look. The lighting crew disagrees.",
    "The red carpet asked me for directions."
   ]
  ],
  "backstage": {
   "scene": [
    "Director: Can you look thoughtful?",
    "Sitara: For the teaser, the trailer or the awards montage?"
   ],
   "spotted": "Giving a curtain its breakthrough supporting role.",
   "weakness": "A camera that has already moved on.",
   "comeback": "One moment. The pause has not peaked.",
   "encore": [
    "My silence has a stylist.",
    "The spotlight asked if I was free for a follow-up meeting.",
    "The window scene is ready. Someone tell the window."
   ]
  }
 },
 {
  "id": "alia-encore",
  "persona": [
   "Small scene. Six expressions. Everybody stay ready.",
   "Chutki keeps a spare expression for emergencies and another for the emergency teaser. She was asked to react to a doorbell and delivered surprise, suspicion, hope, betrayal and a possible sequel. The editor needed one second. She gave him a festival submission. The doorbell has signed with an agent.",
   "Instant scene-stealing",
   "The five-emotion close-up",
   "A clapperboard that cannot keep up",
   [
    "That was my rehearsal reaction. The official gasp is next.",
    "The trailer borrowed my surprised face and forgot to return it.",
    "Can we do the encore before the interval?"
   ]
  ],
  "backstage": {
   "scene": [
    "Director: You only need to say hello.",
    "Chutki: Happy hello, mysterious hello or sequel hello?"
   ],
   "spotted": "Giving the playback monitor a reaction shot.",
   "weakness": "A director who says just be normal.",
   "comeback": "How normal? I have prepared three versions.",
   "encore": [
    "The close-up asked for a little personal space.",
    "I reacted to the plot twist before the writer did.",
    "My shocked face has a separate fan club."
   ]
  }
 },
 {
  "id": "mukesh-megaplan",
  "persona": [
   "If it exists, it needs a ribbon.",
   "Lalaji does not open a cupboard. He unveils a storage experience. Every office addition arrives with flowers, a speech and a nephew holding ceremonial scissors. The new kettle has a launch date, a teaser campaign and a chief guest. Tea will be available after the keynote. Seating is limited.",
   "Ceremonial optimism",
   "The grand unveiling of an ordinary thing",
   "Scissors with a calendar invite",
   [
    "The tea counter is now a launch experience.",
    "We have a vision for the presentation about the vision.",
    "Please do not use the kettle before its keynote."
   ]
  ],
  "backstage": {
   "scene": [
    "Assistant: The new chair has arrived.",
    "Lalaji: Excellent. Inform the ribbon department."
   ],
   "spotted": "Practising the unveiling of an unopened email.",
   "weakness": "Something that quietly starts working.",
   "comeback": "Let us not rush. The welcome speech needs a welcome speech.",
   "encore": [
    "We are expanding the team that announces the expansion.",
    "The office plant is entering an exciting new growth phase.",
    "The scissors are running late. Postpone the opening."
   ]
  }
 },
 {
  "id": "gautam-grandplan",
  "persona": [
   "No napkin leaves this room without a master plan.",
   "Babu sees an empty desk and immediately imagines a model, a map and a viewing gallery. He drew a shortcut to the pantry so ambitious that the pantry now needs its own parking lot. Every arrow on his whiteboard leads to another whiteboard. The eraser has been reassigned to future planning.",
   "Blueprint-level confidence",
   "The scale-model reveal",
   "A map too large for the meeting table",
   [
    "The shortcut is a long-term project.",
    "I brought a scale model of the agenda.",
    "The pantry is phase one. The biscuits are phase three."
   ]
  ],
  "backstage": {
   "scene": [
    "Colleague: We only need to move one desk.",
    "Babu: You are thinking in desks. I am thinking in corridors."
   ],
   "spotted": "Drawing an access road to the suggestion box.",
   "weakness": "A plan that fits on one sheet.",
   "comeback": "We will simplify it in the next master plan.",
   "encore": [
    "The empty slide is reserved for future expansion.",
    "Every dotted line deserves a ceremony.",
    "The office map now includes the route to the office map."
   ]
  }
 },
 {
  "id": "elon-launchpad",
  "persona": [
   "Every coffee deserves a countdown.",
   "Raees arrives at product meetings with a pocket rocket and a reassuringly vague timeline. He has announced the future so often that the present has asked for an appointment. Every demo is a surprise, especially to the engineering team. The coffee machine has been renamed Mission Control. It still takes coins.",
   "Orbital enthusiasm",
   "The surprise prototype",
   "A pocket rocket with launch anxiety",
   [
    "The prototype is performing exactly as the teaser intended.",
    "We are three, two, one minor adjustments away.",
    "This coffee is ready for launch. The cup is not."
   ]
  ],
  "backstage": {
   "scene": [
    "Engineer: It is not finished.",
    "Raees: Perfect. The future should leave room for imagination."
   ],
   "spotted": "Counting backwards near things that do not need to move.",
   "weakness": "A demo with no countdown.",
   "comeback": "It is not a delay. It is extended anticipation.",
   "encore": [
    "The launch date has entered a flexible orbit.",
    "We have disrupted the meeting. Nobody knows where the agenda went.",
    "The demo of the demo will be announced shortly."
   ]
  }
 },
 {
  "id": "sundar-slidechai",
  "persona": [
   "One little slide. A very large appendix.",
   "Shastri can make an enormous keynote sound like a quiet suggestion over chai. He starts with one simple idea and gently reveals that it has thirty-seven slides, six demos and a helpful diagram of the diagram. Nobody remembers the question, but everyone agrees the transition was smooth. The tea is thoughtfully personalised.",
   "Soft-spoken slidecraft",
   "The just-one-more-slide reveal",
   "A remote that knows no final slide",
   [
    "Let me simplify that with one more slide.",
    "The diagram explains the diagram on the previous diagram.",
    "We made the tea break more helpful. It now has a dashboard."
   ]
  ],
  "backstage": {
   "scene": [
    "Colleague: Could you explain it in one sentence?",
    "Shastri: Of course. Shall I share my screen?"
   ],
   "spotted": "Adding a helpful appendix to the lunch menu.",
   "weakness": "A presentation remote with a last-slide button.",
   "comeback": "There is a simple answer. First, some context.",
   "encore": [
    "The welcome slide has a tutorial.",
    "Your question has been moved to a more helpful tab.",
    "The demo works best if nobody demonstrates it."
   ]
  }
 },
 {
  "id": "satya-synergy",
  "persona": [
   "Let us align on the alignment.",
   "Seth believes every problem can become a collaborative whiteboard before anyone has to solve it. His working groups have subgroups, and the subgroups are exploring how to feel more aligned. A quick catch-up once developed into a quarterly offsite. The minutes now need a table of contents. Everybody feels heard, especially the meeting app.",
   "Collaborative confidence",
   "The shared-whiteboard breakthrough",
   "A notebook full of action items for later",
   [
    "Let us collaborate on the collaboration plan.",
    "The whiteboard has joined the working group.",
    "We have reduced meetings by combining three into a longer one."
   ]
  ],
  "backstage": {
   "scene": [
    "Colleague: Who is doing the actual task?",
    "Seth: Great question. Let us form a cross-functional group."
   ],
   "spotted": "Scheduling a quick sync about the next quick sync.",
   "weakness": "A task finished before the kickoff meeting.",
   "comeback": "I hear you. Let us put that on the shared board.",
   "encore": [
    "This could have been an email, but where is the team spirit?",
    "The action item is to identify the action item.",
    "We are empowering everyone to nominate someone else."
   ]
  }
 },
 {
  "id": "indra-boardroom",
  "persona": [
   "Big idea. Small sentence. Sit down.",
   "Aunty can stop a wandering presentation with one warm smile and a question nobody prepared for. She has heard the vision, read the appendix and would like to know who is doing the work before the samosas go cold. The agenda has bullet points. She has follow-up points. Both are very punctual.",
   "Warm, surgical timing",
   "The question before the second coffee",
   "An agenda with no room for an encore agenda",
   [
    "What is the plan after the slide with the plan?",
    "The coffee has a deadline too.",
    "Put the big idea in a smaller sentence. The samosa is getting cold."
   ]
  ],
  "backstage": {
   "scene": [
    "Presenter: Let me begin with our journey.",
    "Aunty: Lovely. Tell me when we reach the point."
   ],
   "spotted": "Returning a forty-slide introduction marked please summarise.",
   "weakness": "A speaker who says before I begin twice.",
   "comeback": "You have begun. Please proceed to the middle.",
   "encore": [
    "The biscuits have been more decisive than this committee.",
    "Vision is excellent. Who is booking the room?",
    "Let us circle back only if the circle reaches a decision."
   ]
  }
 },
{
  "id": "ghanta-guru",
  "persona": [
    "Seventy hours. Even the stopwatch looks tired.",
    "Guru runs a fictional academy where the only subject is more hours. He measures ambition with a wall clock and marks a tea break absent. His calendar has a motivational quote where the weekend used to be. When somebody finishes early, he suspects the assignment was not long enough. The office clock has started hiding behind the annual report.",
    "Clock-powered conviction",
    "The seventy-hour pep talk",
    "A pocket watch with no off switch",
    [
      "The timesheet needs a timesheet.",
      "I have streamlined the weekend into a motivational email.",
      "Your out-of-office message lacks commitment."
    ]
  ],
  "backstage": {
    "scene": [
      "Employee: I finished the work in four hours.",
      "Guru: Excellent. What is your plan for the other sixty-six?"
    ],
    "spotted": "Giving the wall clock a performance improvement plan.",
    "weakness": "A finished task and a switched-off laptop.",
    "comeback": "Rest assured. But can the assurance work late?",
    "encore": [
      "The office chair has requested a standing ovation and a day off.",
      "His five-minute break comes with a seventy-slide justification.",
      "The alarm clock is networking with the snooze button."
    ]
  }
},
{
  "id": "sunday-seth",
  "persona": [
    "Sunday is just Monday wearing casuals.",
    "Seth chairs a fictional committee investigating why the calendar contains days without meetings. His ninety-hour master plan has a special annexure for Sunday, followed by a quick call about the annexure. He treats the weekend like an unfinished construction project: surely another shift will fix it. The desk calendar has asked to be transferred to a greeting-card shop.",
    "Seven-day seriousness",
    "The Sunday calendar takeover",
    "A desk calendar with every day circled",
    [
      "The weekend has been moved to a later phase.",
      "Work-life balance? I have balanced the laptop on the dining table.",
      "The Sunday call is optional. Attendance will explain your ambition."
    ]
  ],
  "backstage": {
    "scene": [
      "Employee: Is Sunday still a holiday?",
      "Seth: Of course. We are just holding a meeting to celebrate it."
    ],
    "spotted": "Colouring every day of the desk calendar office blue.",
    "weakness": "An empty meeting room at noon on Sunday.",
    "comeback": "Let us not lose momentum just because the week has ended.",
    "encore": [
      "His calendar has seven Mondays and a maintenance window.",
      "Sunday declined the meeting. He sent a recurring invite.",
      "The out-of-office reply has been asked to join from home."
    ]
  }
},
{
  "id": "mileage-maharaj",
  "persona": [
    "Better mileage. Fewer laps around the meeting room.",
    "Maharaj takes the fictional boardroom debate for a test drive. While the others count hours, he asks whether anybody built something useful before lunch. He likes a clever prototype, a cup of tea and a caption ready for the group chat. Sometimes the caption reaches production before the prototype. The stopwatch suspects its job has been outsourced to common sense.",
    "Wry, road-trip optimism",
    "The quality-over-quantity pit stop",
    "A toy SUV and a tea cup with excellent mileage",
    [
      "The engine is running. Why is the meeting still idling?",
      "A good idea needs a test drive, not a ninety-hour parking ticket.",
      "Quality time is also a productivity feature."
    ]
  ],
  "backstage": {
    "scene": [
      "Manager: We logged ninety hours on the presentation.",
      "Maharaj: Wonderful. Does the prototype work for ninety seconds?"
    ],
    "spotted": "Taking a useful idea for a drive before the committee finds it.",
    "weakness": "An inspirational caption attached to a very ordinary speed bump.",
    "comeback": "Less time in the parking lot. More distance on the road.",
    "encore": [
      "He posted the prototype. The comments requested a discount.",
      "The brainstorm has torque. The meeting has a flat tyre.",
      "His stopwatch now measures how quickly everyone can go home."
    ]
  }
}
];
export const parodyCast=scripts.map(script=>({...cast.find(c=>c.id===script.id),...script}));
