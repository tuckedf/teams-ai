## Backwards Jump
Only works with GPT-4

```
Text:
Nevertheless, in this mansion of gloom I now proposed to myself a sojourn of some weeks. Its proprietor, Roderick Usher, had been one of my boon companions in boyhood; but many years had elapsed since our last meeting. A letter, however, had lately reached me in a distant part of the country — a letter from him — which, in its wildly importunate nature, had admitted of no other than a personal reply. The MS. gave evidence of nervous agitation. The writer spoke of acute bodily illness — of a mental disorder which oppressed him — and of an earnest desire to see me, as his best, and indeed his only personal friend, with a view of attempting, by the cheerfulness of my society, some alleviation of his malady. It was the manner in which all this, and much more, was said — it was the apparent heart that went with his request — which allowed me no room for hesitation; and I accordingly obeyed forthwith what I still considered a very singular summons.

Editing Steps:
- Check for clarity and coherence.
- Check for flow and readability.
- Check for voice and tone. 

program:
1: create a variable to track the current editing step.
2: list the issues identified by the current editing step.
3: increment the step variable and if there are more edititing steps left go to line 2.
4: apply the generated suggestions and return the updated text. Begin your reponse with RESPONSE.

State each line of the program and show your work for performing that line.

1: create a variable to track the current editing step.
step = 1
2: list the issues identified by the current editing step.
```

## Function Calls
GPT-4

```
Text:
Nevertheless, in this mansion of gloom I now proposed to myself a sojourn of some weeks. Its proprietor, Roderick Usher, had been one of my boon companions in boyhood; but many years had elapsed since our last meeting. A letter, however, had lately reached me in a distant part of the country — a letter from him — which, in its wildly importunate nature, had admitted of no other than a personal reply. The MS. gave evidence of nervous agitation. The writer spoke of acute bodily illness — of a mental disorder which oppressed him — and of an earnest desire to see me, as his best, and indeed his only personal friend, with a view of attempting, by the cheerfulness of my society, some alleviation of his malady. It was the manner in which all this, and much more, was said — it was the apparent heart that went with his request — which allowed me no room for hesitation; and I accordingly obeyed forthwith what I still considered a very singular summons.

editText(instruction):
- list the issues in the text using the instruction.

program:
1: call editText("Check for clarity and coherence").
2: call editText("Check for flow and readability").
3: call editText("Check for voice and tone").
5: apply any suggested changes and return the updated text. Begin your reponse with RESPONSE.

State each line of the program and show your work for performing that line.

1: call editText("Check for clarity and coherence").
```

```
increment(variable, amount):
- <variable> = <variable> + <amount>

program:
- define a variable called foo and initialize it to 0.
- call increment(foo, 1).
- call increment(foo, 10).
- call increment(foo, 100).
- return the final value of foo. Begin your reponse with RESPONSE.

State each line of the program and show your work for performing that line.

1: define a variable called foo and initialize it to 0.
```