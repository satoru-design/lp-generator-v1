"use client";

import React, { useState } from 'react';
import { Rocket, Send, Eye, Settings, Loader2, Sparkles, CheckCircle, ChevronRight } from 'lucide-react';

const GENERATION_MODEL = "gemini-3.1-pro-preview";

export default function LPGeneratorApp() {
  const [step, setStep] = useState<'input' | 'loading' | 'preview'>('input');
  const [config, setConfig] = useState({ apiKey: '' });
  const [formData, setFormData] = useState({
    industry: '',
    category: '',
    productName: '',
    price: '',
    usp: '',
    features: '',
    targetGender: '',
    targetAge: ''
  });
  const [content, setContent] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.apiKey) {
      alert("Gemini APIキーを入力してください。");
      return;
    }
    
    setStep('loading');
    
    const systemPrompt = `
あなたは超一流の物販マーケターです。以下の商品情報を受け取り、コンバージョン率を最大化させるためのLPドラフトを作成してください。

# 構成ルール
「PASONAの法則」に基づき、読者が「自分のための商品だ」と確信し、最後には「買わない理由がない」と思わせる論理構成にしてください。

# 執筆トーン
- 信頼感がありつつも、親身になって悩みに寄り添うトーン。
- 専門用語は避け、中学生でもベネフィットが理解できる平易かつ力強い言葉を使ってください。

# 出力項目（JSON形式）
以下の構造を持つJSONを出力してください。Markdown表記などで囲わないでください。

{
  "hero": {
    "catchcopies": ["...", "...", "..."], // 強烈なキャッチコピー（ヘッドライン）3選
    "title": "...", // 選択したキャッチコピーの1つ
    "sub": "...",
    "cta": "..."
  },
  "painPoints": [
    { "title": "...", "text": "..." } // 読者の悩みを代弁する共感セクション
  ],
  "solution": {
    "title": "...", // 商品が提供する究極のベネフィット（機能ではなく未来の状態）
    "text": "..."
  },
  "proof": [
    { "title": "...", "text": "..." } // 信頼を裏付けるエビデンスの配置案
  ],
  "closing": {
    "price": "...",
    "benefit": "...", // 今すぐ購入すべき理由（オファー・限定性）
    "cta": "..."
  }
}
    `;

    const imagePrompt = `${formData.industry}業界の商材「${formData.productName}」の魅力を伝える高品質の広告用ヒーロー画像。フォトリアル、クリーンでモダンなデザイン、明るい雰囲気、ユーザーの目を惹きつける構図。`;

    try {
      const [textResponse, imageResponse] = await Promise.all([
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GENERATION_MODEL}:generateContent?key=${config.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: JSON.stringify(formData) }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }),
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${config.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: imagePrompt }] }]
          })
        }).catch(e => {
          console.error("Image API Error:", e);
          return null;
        })
      ]);
      
      if (!textResponse.ok) {
        throw new Error(`API Error: ${textResponse.status}`);
      }
      
      const textResult = await textResponse.json();
      const generatedText = textResult.candidates[0].content.parts[0].text;
      const parsedContent = JSON.parse(generatedText);

      if (imageResponse && imageResponse.ok) {
        try {
          const imgResult = await imageResponse.json();
          const part = imgResult.candidates?.[0]?.content?.parts?.[0];
          if (part?.inlineData) {
             parsedContent.heroImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          } else if (part?.text && part.text.startsWith('http')) {
             parsedContent.heroImage = part.text;
          }
        } catch (e) {
          console.error("Failed to parse image result:", e);
        }
      }

      setContent(parsedContent);
      setStep('preview');
    } catch (error: any) {
      alert("生成に失敗しました: " + error.message);
      setStep('input');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Rocket size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
              LP Auto-Generator
            </h1>
          </div>
          
          {step === 'input' && (
            <div className="flex items-center bg-white rounded-full border border-slate-200 pl-4 pr-1 py-1 shadow-sm text-sm">
              <Settings size={16} className="text-slate-400 mr-2" />
              <input 
                type="password" 
                placeholder="Gemini API Key..." 
                className="outline-none bg-transparent w-48 text-slate-600 placeholder:text-slate-400"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              />
            </div>
          )}
          {step === 'preview' && (
             <button onClick={() => setStep('input')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex items-center">
               ← 入力に戻る
             </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Step: Input */}
        {step === 'input' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4 sm:text-4xl">
                売れるランディングページを<br/><span className="text-indigo-600">一瞬で自動生成。</span>
              </h2>
              <p className="text-lg text-slate-600">
                PASONAの法則に基づき、あなたの商材の魅力を最大限に引き出す構成をAIが提案します。
              </p>
            </div>

            <form onSubmit={handleGenerate} className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
              
              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">業界</label>
                    <input required type="text" name="industry" placeholder="例: IT, 美容, 教育..." value={formData.industry} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 bg-slate-50 border px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">カテゴリ</label>
                    <input required type="text" name="category" placeholder="例: SaaSツール, 化粧水..." value={formData.category} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 bg-slate-50 border px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ターゲット（性別）</label>
                    <select required name="targetGender" value={formData.targetGender} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 bg-slate-50 border px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none appearance-none">
                      <option value="" disabled>選択してください</option>
                      <option value="男女">男女</option>
                      <option value="男性">男性</option>
                      <option value="女性">女性</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ターゲット（年齢）</label>
                    <select required name="targetAge" value={formData.targetAge} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 bg-slate-50 border px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none appearance-none">
                      <option value="" disabled>選択してください</option>
                      {Array.from({ length: 13 }, (_, i) => 20 + i * 5).map(age => (
                        <option key={age} value={`${age}代`}>{age}代</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">商材名</label>
                  <input required type="text" name="productName" placeholder="商品やサービスの名称" value={formData.productName} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 bg-slate-50 border px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">単価 / 価格感</label>
                  <input required type="text" name="price" placeholder="例: 月額980円, 買い切り1万円..." value={formData.price} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 bg-slate-50 border px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">強み (USP - Unique Selling Proposition)</label>
                  <input required type="text" name="usp" placeholder="他社との違い、圧倒的なメリット" value={formData.usp} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 bg-slate-50 border px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">特徴 (カンマ区切りで複数可)</label>
                  <textarea required name="features" rows={3} placeholder="例: 1日5分で完了, 専門知識不要, 24時間サポート..." value={formData.features} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 bg-slate-50 border px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none" />
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full flex items-center justify-center py-4 px-8 border border-transparent rounded-xl shadow-lg shadow-indigo-200/50 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.01] duration-200">
                    <Sparkles className="w-5 h-5 mr-2" />
                    LP構成を自動生成する
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Step: Loading */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative w-24 h-24 mb-8 text-indigo-600">
              <Loader2 className="w-full h-full animate-spin opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <Sparkles className="w-8 h-8 animate-pulse text-purple-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">AIがLP構成を考えています...</h3>
            <p className="text-slate-500">PASONAの法則に基づき、最適なメッセージを構築中</p>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && content && (
          <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* HERO SECTION */}
            <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl flex flex-col md:flex-row items-stretch min-h-[500px]">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay border-none"></div>
              
              <div className="relative z-10 p-8 sm:p-16 flex-1 flex flex-col justify-center text-center md:text-left">
                <div className="space-y-8 max-w-2xl mx-auto md:mx-0">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-sm tracking-wider uppercase border border-indigo-400/30 mb-4">
                    {content.hero.sub}
                  </span>
                  
                  {content.hero.catchcopies && content.hero.catchcopies.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm text-indigo-200 mb-2 font-semibold">【提案ヘッドライン 3選】</p>
                      <ul className="text-left space-y-2 mb-6 text-slate-100/90 text-sm md:text-base border-l-4 border-indigo-500 pl-4">
                        {content.hero.catchcopies.map((copy: string, idx: number) => (
                          <li key={idx}>・{copy}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                    {content.hero.title}
                  </h1>
                  <div className="pt-8">
                    <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-lg px-10 py-5 rounded-full shadow-xl shadow-indigo-500/30 hover:scale-105 transition-transform duration-300 flex items-center mx-auto md:mx-0">
                      {content.hero.cta}
                      <ChevronRight className="ml-2 w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {content.heroImage && (
                <div className="relative z-10 w-full md:w-[45%] lg:w-1/2 min-h-[300px] md:min-h-full bg-slate-800/50">
                   {/* Gradient overlay to seamlessly merge text area and image */}
                   <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent z-10 pointer-events-none"></div>
                   <img src={content.heroImage} alt={content.hero.title} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              )}
            </section>

            {/* PROBLEM & AFFINITY SECTION */}
            <section className="max-w-4xl mx-auto py-12">
               <div className="text-center mb-16">
                  <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Problem / Affinity</h2>
                  <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                    こんなお悩み、ありませんか？
                  </p>
               </div>
               <div className="grid gap-8 sm:grid-cols-2">
                 {content.painPoints.map((point: any, idx: number) => (
                   <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                     <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center mb-6 text-xl font-bold">
                       {idx + 1}
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-3">{point.title}</h3>
                     <p className="text-slate-600 leading-relaxed">{point.text}</p>
                   </div>
                 ))}
               </div>
            </section>

            {/* SOLUTION SECTION */}
            <section className="bg-indigo-50 rounded-3xl p-8 sm:p-16 max-w-5xl mx-auto border border-indigo-100/50">
               <div className="text-center">
                  <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Solution</h2>
                  <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-8">
                    {content.solution.title}
                  </p>
                  <p className="text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
                    {content.solution.text}
                  </p>
               </div>
            </section>

            {/* PROOF & NARROWING SECTION */}
            <section className="max-w-4xl mx-auto py-12">
               <div className="text-center mb-16">
                  <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Proof / Narrowing</h2>
                  <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                    なぜ選ばれるのか？
                  </p>
               </div>
               <div className="space-y-8">
                 {content.proof.map((item: any, idx: number) => (
                   <div key={idx} className="flex flex-col sm:flex-row bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 items-start sm:items-center">
                     <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                     </div>
                     <div>
                       <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                       <p className="text-slate-600">{item.text}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </section>

            {/* CLOSING & ACTION SECTION */}
            <section className="max-w-4xl mx-auto">
               <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-10 sm:p-16 text-center text-white shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10"></div>
                 <div className="relative z-10">
                   <h2 className="text-base font-semibold tracking-wide uppercase text-indigo-200 mb-2">Offer / Action</h2>
                   <p className="text-3xl sm:text-4xl font-extrabold mb-6">
                     {content.closing.benefit}
                   </p>
                   <div className="bg-white/10 inline-block px-8 py-4 rounded-2xl backdrop-blur-sm border border-white/20 mb-8">
                     <span className="text-indigo-100 block text-sm mb-1">特別価格</span>
                     <span className="text-4xl font-black">{content.closing.price}</span>
                   </div>
                   <div>
                     <button className="bg-white text-indigo-900 font-bold text-xl px-12 py-5 rounded-full shadow-xl hover:scale-105 transition-transform duration-300 w-full sm:w-auto">
                       {content.closing.cta}
                     </button>
                   </div>
                 </div>
               </div>
            </section>
          </div>
        )}

      </main>
    </div>
  );
}
