import './App.css'
// import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useCallback, useEffect, useRef, useState} from "react";
// import {Textarea} from "@/components/ui/textarea.tsx";
// import {Card, CardContent} from "@/components/ui/card.tsx";
import axios from "axios";
// import {useLocalStorage} from "@uidotdev/usehooks";
import {v4 as uuidv4} from 'uuid';
import {Input} from "@/components/ui/input.tsx";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
const DEEPSEEK_API_KEY = "sk-cdebb38846164c0489af7fc036e873b2"
const YOUR_BUSINESS_NAME = 'salah'
const StorageName = 'data4'
type Msg = {
    isBot: boolean,
    msg: string,
    id: string,
    created_at: string,
    was_sent: 'loading'|'success'|'failure',
}

function App() {
    const [loading, setLoading] = useState<boolean>(false)
    const getData = useCallback(() => {
        const data = window.localStorage.getItem(StorageName)
        if (data) {
            return JSON.parse(data)
        }
        return []
    }, [])

    const [data, setData] = useState<Msg[]>(getData())
    const updateData=useCallback(()=>{
        setData(getData())
    },[getData])

    const saveMsg:(isBot:boolean,msg:string)=>Msg = useCallback((isBot:boolean,msg: string) => {
        const msG:Msg = {
            isBot,
            msg,
            id: uuidv4(),
            created_at: new Date().toISOString(),
            was_sent: 'loading',
        }
        setData((d)=>{
            return [...d, msG]
        })
        // window.localStorage.setItem(StorageName, JSON.stringify())
        // updateData()
        return msG

    }, [])
    const updateFailure = useCallback((id:string)=>{
        setData((d)=>{
           return  d.map((m)=>{
                if(m.id === id){
                    return {
                        ...m,
                        was_sent: 'failure',
                    }
                }
                return m
            })
        })
    },[])

    const addCustomerMsg = useCallback((msg: string) => {
        return  saveMsg(false, msg)

    }, [saveMsg])

    const addBotMsg = useCallback((msg: string) => {
        return  saveMsg(true, msg)
    }, [saveMsg])


    const ask = async (question: string): Promise<string | undefined> => {
        const headers = {
            "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json"
        }
        const enhanced_prompt = `
    You are a customer service agent for ${YOUR_BUSINESS_NAME}.
    The customer asks: ${question}

    `
        const payload = {
            model: "deepseek-chat",
            messages: [{role: "user", content: enhanced_prompt}],
            temperature: 0.7
        }

        try {

            const rs = await axios({
                method: 'post',
                url: DEEPSEEK_API_URL,
                headers,
                data: payload
            })
            const response: string = rs.data.choices[0].message.content
            console.log(response)

            return response ?? ''
        } catch (e) {
            console.log(e)
            return undefined
        }
    }

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const msg = e.currentTarget.elements.namedItem('msg')?.value
        e.currentTarget.reset()
        if (msg) {

            const newMsg= addCustomerMsg(msg)
            try {
                setLoading(true)
                const res = await ask(msg)

                if (res != undefined) {
                    addBotMsg(res)
                }
            } catch (e) {
                console.log('\n\n ', e)
                updateFailure(newMsg.id)
            } finally {
                setLoading(false)
            }
        }

    }
    const dataRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (dataRef.current) {
            dataRef.current.scrollTo(0, dataRef.current.scrollHeight)
        }
        window.localStorage.setItem(StorageName, JSON.stringify(data))
    }, [data])



    return (
        <div className={'flex justify-center p-2 bg-gray-100 h-screen items-center'} dir={'rtl'}>
            <div className="max-w-2xl flex-1  max-h-[95vh] overflow-y-auto flex  flex-col justify-center   ">
                <div className="w-full text-center p-2  ">Simple Chat bot</div>
                <div
                    className="relative min-h-[90vh] bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-2 shadow-sm">
                    <div className="flex-1"></div>
                    <div className="  flex flex-col overflow-auto " ref={dataRef}>
                        {data.map((msg) => (
                            <Message msg={msg} key={msg.id}  />
                            )
                        )}
                        <div dir={'ltr'} className="">
                            {loading && (
                                <div className={"loading" + " "}>Loading...</div>
                            )}
                        </div>
                    </div>
                    <form className="flex gap-1 items-center" onSubmit={onSubmit}>
                        <Button className="">send</Button>
                        {/*<Input className={''}/>*/}
                        <Input name={'msg'}/>
                    </form>
                </div>

            </div>

        </div>
    )
}


function Message({msg, className}: { msg:Msg,  className?: string }) {
    return <div className={'w-fit   p-2 ' + (msg.isBot ? 'mr-auto' : 'ml-auto')}>
        <div
            className={'bg-ard text-card-foreground  flex flex-col gap-6 rounded-xl border p-4 shadow-sm   ml-auto' + ' '
                + (msg.isBot? 'rounded-bl-none' : 'rounded-br-none') + ' '+(msg.isBot?'':'  bg-blue-50 ') + className
            }>
            <div className={' '} dir={'rtl'}>
                <div className="w-full ">
                    <div className="flex gap-1">
                        {msg.was_sent=='failure'&&(
                            <div>Error</div>
                        )}
                    {msg.msg}
                    </div>
                </div>
            </div>
        </div>
    </div>
}


// function CustomerMsg({text}: { text: string,msg:Msg }) {
//     return <Message text={text} dir={'right'} className={'bg-blue-50'}/>
// }
//
// function BotMsg({text}: { text: string }) {
//     return <Message text={text} dir={'left'}/>
// }

export default App
