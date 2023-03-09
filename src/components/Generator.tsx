import { createSignal, For, Show, onMount } from "solid-js";
import MessageItem from "./MessageItem";
import IconClear from "./icons/Clear";
import type { ChatMessage } from "../types";

export default () => {
  let inputRef: HTMLInputElement;
  const [messageList, setMessageList] = createSignal<ChatMessage[]>([]);
  const [currentAssistantMessage, setCurrentAssistantMessage] =
    createSignal("");
  const [loading, setLoading] = createSignal(false);

  onMount(async () => {
    let str = "";
    function delaysum(e, i) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          str += e;
          resolve(str);
        }, 12 * i);
      });
    }
    async function reader(content) {
      const arr = content.split("");
      arr.forEach(async (element, i) => {
        await delaysum(element, i);
        setMessageList([
          {
            role: "assistant",
            content: str,
          },
        ]);
      });
    }
    reader(
      "你好！我是一名人工智能语言模型，名字叫做chatgpt。我使用了一种称为GPT（Generative Pre-trained Transformer）的技术，可以生成自然语言文本，例如回答问题、提供建议、进行对话等等。我可以学习和理解人类的语言，可以与人类进行交互。"
    );
    
  });

  const handleButtonClick = async () => {
    const inputValue = inputRef.value;
    if (!inputValue) {
      return;
    }
    setLoading(true);
    // @ts-ignore
    if (window?.umami) umami.trackEvent("chat_generate");
    inputRef.value = "";
    setMessageList([
      ...messageList(),
      {
        role: "user",
        content: inputValue,
      },
    ]);

    const response = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({
        messages: messageList(),
      }),
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = response.body;
    if (!data) {
      throw new Error("No data");
    }
    const reader = data.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      if (value) {
        let char = decoder.decode(value);
        if (char === "\n" && currentAssistantMessage().endsWith("\n")) {
          continue;
        }
        if (char) {
          setCurrentAssistantMessage(currentAssistantMessage() + char);
        }
      }
      done = readerDone;
    }
    setMessageList([
      ...messageList(),
      {
        role: "assistant",
        content: currentAssistantMessage(),
      },
    ]);
    setCurrentAssistantMessage("");
    setLoading(false);
  };

  const clear = () => {
    inputRef.value = "";
    setMessageList([]);
    setCurrentAssistantMessage("");
  };

  return (
    <div class="h-76%" style="overflow: hidden;">
      <div style="height: 100%;overflow-y: auto;overflow-x: hidden;">
        <For each={messageList()}>
          {(message) => (
            <MessageItem role={message.role} message={message.content} />
          )}
        </For>
        {currentAssistantMessage() && (
          <MessageItem role="assistant" message={currentAssistantMessage} />
        )}
      </div>
      <div class="fixed widthmain bottom-4 left-50% translate">
        <Show
          when={!loading()}
          fallback={() => (
            <div class="h-12 widthmain my-4 flex items-center justify-center bg-slate bg-op-15 text-slate rounded-sm">
              AI is thinking...
            </div>
          )}
        >
          <div class="my-4 flex items-center justify-center gap-2">
            <input
              ref={inputRef!}
              type="text"
              id="input"
              placeholder="Enter something..."
              autocomplete="off"
              autofocus
              disabled={loading()}
              onKeyDown={(e) => {
                e.key === "Enter" && !e.isComposing && handleButtonClick();
              }}
              w-full
              px-4
              h-12
              text-slate
              rounded-sm
              bg-slate
              bg-op-15
              focus:bg-op-20
              focus:ring-0
              focus:outline-none
              placeholder:text-slate-400
              placeholder:op-30
            />
            <button
              onClick={handleButtonClick}
              disabled={loading()}
              h-12
              px-4
              py-2
              bg-slate
              bg-op-15
              hover:bg-op-20
              text-slate
              rounded-sm
            >
              Send
            </button>
            <button
              title="Clear"
              onClick={clear}
              disabled={loading()}
              h-12
              px-4
              py-2
              bg-slate
              bg-op-15
              hover:bg-op-20
              text-slate
              rounded-sm
            >
              <IconClear />
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
};
