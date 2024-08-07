"use client"
import Header from "../../components/Header";
import { FaRobot } from "react-icons/fa";
import { useState, useEffect, useRef} from "react";
import { Messages } from "../../../pages/messages/assistantMessages";
import TypeWriter from '../../components/TypeWriter';
import chatStyles from '../../components/chatBubble.module.css'
import { AiOutlineSend } from "react-icons/ai";

export interface ChatMessage {
  sender: string;
  text: string;
  imageUrl: string;
  clickedInHistory: boolean; 
  loading: boolean;
}

interface HomeProps {
  username: string
}

export default function Home({username}: HomeProps) {
  const [userInput, setUserInput] = useState('');
  const [image, setImage] = useState('');
  const [imageCount, setImageCount] = useState<number>(1);
  const messageRefs = useRef<HTMLDivElement[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [processingMessage, setProcessingMessage] = useState(false);


  // chat history stuff
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0);

  const generateImage = async() => {
    setProcessingMessage(true);
    
    const response = await fetch('../api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `${userInput}`
      }),
    })
    const data = await response.json();
    setImage(data.url);
    setUserInput('');
    console.log(data.url);

    setProcessingMessage(false);
      
  }

  const addMessageToHistory = (
    prevHistory: ChatMessage[],
    sender: 'user' | 'ai',
    text: string,
    imageUrl: string,
    clickedInHistory: boolean,
    loading: boolean
  ): ChatMessage[] => {
    const newMessage: ChatMessage = { sender, text, imageUrl, clickedInHistory, loading};
    return [...prevHistory, newMessage];
  }


  const sendMessage = () => {
    if (userInput) {
        let clicked = false;
        if (chatHistory.length === 0)
          clicked = true;

        // Adding user message to chat history
        setChatHistory((prevHistory: ChatMessage[]): ChatMessage[] => {
          return addMessageToHistory(prevHistory, 'user', userInput, image, clicked, false);
        });

        // Adding ai reponse to chat history
        setChatHistory((prevHistory: ChatMessage[]): ChatMessage[] => {
          return addMessageToHistory(prevHistory, 'ai', Messages.imgGeneration, '', false, true);
        });


        const messageInput = (document.getElementById("message-input") as HTMLInputElement);
        messageInput.value = '';
        setUserInput('');

        generateImage();

    }
  }

  const downloadImage = (url: string) => {
     // Create an anchor element
     const downloadLink = document.createElement('a');
     downloadLink.href = url;
     downloadLink.download = `image${imageCount}.png`; // Set the desired filename for download
 
     // Append the anchor element to the DOM
     document.body.appendChild(downloadLink);
 
     // Programmatically trigger the download
     downloadLink.click();
 
     // Clean up: Remove the anchor element from the DOM
     document.body.removeChild(downloadLink);
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current)
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }

  const scrollToMessage = (index: number) =>  {
    chatHistory[currentHistoryIndex].clickedInHistory = false;
    chatHistory[index].clickedInHistory = true;
    setCurrentHistoryIndex(index);

    const targetMessage = messageRefs.current[index];
    if (targetMessage) {
      targetMessage.scrollIntoView({ behavior: 'smooth'});
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && userInput.trim()) {
        sendMessage();
      }
  }


  useEffect(() => {
    scrollToBottom();

  }, [chatHistory]);

  useEffect(() => {
    if (image) {
        // update to new image url 
        setChatHistory(prevHistory => {
          const updatedHistory = [...prevHistory];
          const lastMessageIndex = updatedHistory.length - 1;
          updatedHistory[lastMessageIndex] = {
            ...updatedHistory[lastMessageIndex],
            imageUrl: image,
            loading: false,
          };

          setImageCount(imageCount + 1);
          return updatedHistory;
        })

            // Scroll to the bottom after updating the chat history
            scrollToBottom();

            // Additional scroll to bottom after a short delay to ensure image is fully loaded
            setTimeout(() => {
                scrollToBottom();
            }, 300);
    }

  },[image]);

  return (
    <>
    <main className="h-screen w-full flex flex-col">
    <Header />
    <div className="flex-1 grid grid-cols-7 ml-6 mr-6">
      <div className="text-white hidden sm:block sm:col-span-1 p-4 overflow-y-auto h-chatHistoryBox ">
        <h1 className="font-medium mb-2">Today</h1>
        {chatHistory.map((chatMessage, index) => {
          if (chatMessage.sender === 'user'){
            if (chatMessage.clickedInHistory) {
              return (
                <div key={index} onClick = {() => scrollToMessage(index)} className="border border-gray-200 rounded-md hover:rounded-md mb-3 p-2 truncate hover:cursor-pointer">
                  {chatMessage.text}
                </div>
              )
            }
            else {
              return (
                <div key={index} onClick = {() => scrollToMessage(index)} className=" border border-transparent hover:border-gray-200 hover:rounded-md hover:cursor-pointer mb-3 p-2 truncate ">
                  {chatMessage.text}
                </div>
              )
            }
          }
      
        })}
      </div>
      <div className="col-span-6 p-4 sm:pl-[5rem] sm:pr-[5rem] lg:pl-0 lg:pr-0 flex flex-col ">
        <div id="chat-box" className="flex flex-col bg-white h-chatbox lg:ml-40 lg:mr-40 overflow-y-auto scrollbar-custom rounded-lg">
          {chatHistory.map((chatMessage,index) => {
            const minWidth = 100;
            const maxWidth = 500;
            const textWidth = chatMessage.text.length * 10;
            const finalWidth = Math.min(Math.max(minWidth, textWidth), maxWidth);
            const containerStyle = {
              maxWidth: `${finalWidth}px`,
            }
            
            // display user messages
            if (chatMessage.sender === 'user') {
              return (
                <div key={index} 
                    ref={(reference) => {
                      if (reference)
                        messageRefs.current[index] = reference as HTMLDivElement;
                    }}
                    className={`mt-5 mb-2 mr-10 ml-auto text-center right-0 border border-blue-500 rounded-lg p-2 bg-white break-words ${chatStyles.talkBubbleUser} ${chatStyles.border} ${chatStyles.triRightOnRightSide}`} 
                    style={containerStyle}>
                  {chatMessage.text}
                </div>
              );
            }

          // display ai messages + image generated
           else {
              return (<div key={index} className="flex flex-row">
                <FaRobot size="30px" className="mt-10 ml-3"/>
                <div className={` mt-5 mb-2 ml-5 max-w-256 border border-blue-500 rounded-lg p-2 bg-white break-words ${chatStyles.talkBubbleAi} ${chatStyles.border} ${chatStyles.triRightOnLeftSide}`}>
                {chatMessage.loading ? (
                <>
                  <div className={`${chatStyles.dot1_delay } ${chatStyles.loadingAnimation}`}/>
                  <div className={`${chatStyles.dot2_delay } ${chatStyles.loadingAnimation}`}/>
                  <div className={`${chatStyles.dot3_delay } ${chatStyles.loadingAnimation}`}/>
                  
                </>
                )
                   : (<div className="flex flex-col">
                    
                    <TypeWriter text={Messages.imgGeneration} />
                    <img src={chatMessage.imageUrl} alt="Generated Image" className="object-cover"/>
                    <button onClick={() => downloadImage(chatMessage.imageUrl)} className="bg-downloadBox mt-2 rounded-md font-semibold 0flex justify-center hover:bg-downloadBoxOnHover pt-2 pb-2" style={{width: "238px"}}>Download Image</button> 
                   </div>)}
                       </div>
                  </div>

              )
            }
           
              })}
          <div ref={messagesEndRef}></div>{/* This div will be scrolled to */}
      
        </div>
        <div className="flex lg:ml-40 lg:mr-40">
            <div className="p-6 flex items-center bg-textBox shadow-lg rounded-md w-full">
              <input type="text" id="message-input" placeholder="Type your message..." disabled={processingMessage} className="w-full ml-5 mr-5 pl-5 pt-2 pb-2 text-lg rounded-lg" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserInput(e.target.value)} onKeyDown={handleKeyPress}/> 
              <button id="send-btn" onClick={() => sendMessage()} disabled={processingMessage}><AiOutlineSend className={`w-10 h-10 p-[5px] flex items-center justify-center text-white rounded-full border-2 ${userInput ? "bg-black  hover:bg-gray-600" : "bg-gray-300"}`}/></button>
              
            </div>
          </div>
      </div>
    </div>
  </main>
  </>
  );


  
}
