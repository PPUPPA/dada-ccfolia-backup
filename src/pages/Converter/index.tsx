import React, { useState, useRef, ChangeEvent } from 'react';
import { Download, Upload, Copy, RefreshCw, Settings as SettingsIcon, CheckCircle2, HelpCircle, X, ClipboardCheck, Heart } from 'lucide-react';
import { SketchPicker } from 'react-color';
import { getExtractedCharacters, generateDadaHTMLParts } from '../../utils/converter';
import { ICCFoliaMessage, ICharacter, ISettings, ITabStyle } from '../../interfaces';
import * as S from './styled';

const SUPPORT_LINKS = {
  paypal: "", // 페이팔 링크
  kakaopay: "https://open.kakao.com/o/sBzTaM3e", // 카카오 오픈채팅 링크
  postype: "https://www.postype.com/@abekobe/post/21964340", // 포스타입
};

const Converter: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [roomId, setRoomId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [messages, setMessages] = useState<ICCFoliaMessage[]>([]);
  const [characters, setCharacters] = useState<ICharacter[]>([]);
  const [fetchSuccess, setFetchSuccess] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  const [isHtmlMode, setIsHtmlMode] = useState<boolean>(false);
  const [activePickerIndex, setActivePickerIndex] = useState<number | null>(null);
  
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  const [settings, setSettings] = useState<ISettings>({
    sessionTitle: 'TRPG Session',
    hideOtherTab: true,
    chunkSize: 40000,
    tabStyles: [
      { tab: 'info', color: '#c9dbfe', customStyle: 'padding-left: 8px !important; padding-right: 8px !important; font-size: .95em; font-style: normal; line-height: 1.6;' }
    ]
  });

  const [outputParts, setOutputParts] = useState<string[]>([]);
  const [activePart, setActivePart] = useState<number>(0);
  const [copiedPart, setCopiedPart] = useState<number>(-1);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showSupport, setShowSupport] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortMessagesChronologically = (msgs: ICCFoliaMessage[]): ICCFoliaMessage[] => {
    return [...msgs].sort((a, b) => {
      const timeA = a.fields?.createdAt?.timestampValue || a.createTime || '';
      const timeB = b.fields?.createdAt?.timestampValue || b.createTime || '';
      if (!timeA || !timeB) return 0;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });
  };

  const callFetchRoom = async () => {
    if (!roomId) return;
    setLoading(true);
    setFetchSuccess(false);
    setIsDownloaded(false);
    setIsHtmlMode(false);
    setError('');
    setUploadedFileName('');
    
    const fetchedMessages: ICCFoliaMessage[] = [];
    let token = '';

    try {
      do {
        const url = `https://firestore.googleapis.com/v1/projects/ccfolia-160aa/databases/(default)/documents/rooms/${roomId}/messages/?pageSize=300${token ? '&pageToken=' + token : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('방 번호를 확인하거나 접근 권한이 없습니다.');
        const data = await res.json();
        
        if (data.documents) {
          fetchedMessages.push(...data.documents);
        }
        token = data.nextPageToken;
      } while (token);

      if (fetchedMessages.length === 0) {
        throw new Error('로그가 존재하지 않습니다.');
      }

      const sortedMessages = sortMessagesChronologically(fetchedMessages);

      setMessages(sortedMessages);
      setCharacters(getExtractedCharacters(sortedMessages));
      setFetchSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFetchSuccess(false);
    setIsDownloaded(false);
    setIsHtmlMode(false);
    setError('');
    setUploadedFileName(file.name);
    setRoomId('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        if (file.name.endsWith('.html')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(result, 'text/html');
          const pTags = doc.querySelectorAll('p');
          const parsedMsgs: ICCFoliaMessage[] = [];
          
          pTags.forEach((p, index) => {
            const spans = p.querySelectorAll('span');
            if (spans.length >= 3) {
              const channelRaw = spans[0].textContent?.trim() || '';
              const channel = channelRaw.replace(/^\[/, '').replace(/\]$/, '').trim();
              const name = spans[1].textContent?.trim() || '';
              
              const styleAttr = p.getAttribute('style') || '';
              const colorMatch = styleAttr.match(/color:\s*(#[0-9a-fA-F]{3,6})/i);
              const color = colorMatch ? colorMatch[1] : '#888888';
              
              let txt = spans[2].innerHTML.trim();
              txt = txt.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/gi, ' ');
              txt = txt.replace(/<\/?[^>]+(>|$)/g, '');

              parsedMsgs.push({
                fields: {
                  color: { stringValue: color },
                  channel: { stringValue: channel },
                  name: { stringValue: name },
                  text: { stringValue: txt },
                  createdAt: { 
                    stringValue: new Date(1500000000000 + index).toISOString(),
                    timestampValue: new Date(1500000000000 + index).toISOString()
                  }
                }
              });
            }
          });
          
          if (parsedMsgs.length === 0) throw new Error('HTML 태그에서 관련 메시지 포맷을 찾을 수 없습니다.');
          
          const sortedMessages = sortMessagesChronologically(parsedMsgs);
          setMessages(sortedMessages);
          setCharacters(getExtractedCharacters(sortedMessages));
          setIsHtmlMode(true);
          setFetchSuccess(true);
        } else {
          const json = JSON.parse(result);
          if (!Array.isArray(json)) throw new Error('유효한 JSON 파일이 아닙니다.');
          
          const sortedMessages = sortMessagesChronologically(json);
          setMessages(sortedMessages);
          setCharacters(getExtractedCharacters(sortedMessages));
          setIsHtmlMode(false);
          setFetchSuccess(true);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleChangeCharType = (idx: number, value: string) => {
    const newChars = [...characters];
    newChars[idx].type = value;
    setCharacters(newChars);
  };

  const handleClickGenerate = () => {
    const parts = generateDadaHTMLParts(messages, settings, characters, settings.chunkSize || 40000);
    setOutputParts(parts);
    setActivePart(0);
    setStep(3);
  };

  const handleClickDownloadJson = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `log_${roomId || 'uploaded'}.json`;
    a.click();
    setIsDownloaded(true);
  };
  
  const handleClickAddTabStyle = () => {
    setSettings({...settings, tabStyles: [...settings.tabStyles, { tab: '', color: '#3a6ab7', customStyle: '' }]});
  };
  
  const handleChangeTabStyle = (index: number, field: keyof ITabStyle, value: string) => {
    const newStyles = [...settings.tabStyles];
    (newStyles[index] as any)[field] = value;
    setSettings({...settings, tabStyles: newStyles});
  };
  
  const handleClickRemoveTabStyle = (index: number) => {
    const newStyles = [...settings.tabStyles];
    newStyles.splice(index, 1);
    setSettings({...settings, tabStyles: newStyles});
  };

  const handleClickCopyPart = (idx: number, partHtml: string) => {
    navigator.clipboard.writeText(partHtml);
    setCopiedPart(idx);
    setTimeout(() => setCopiedPart(-1), 2000);
  };

  const handleClickDownloadPart = (idx: number, partHtml: string) => {
    const fullHtml = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>${settings.sessionTitle}</title>\n<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@400;500;700&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="https://tistory1.daumcdn.net/tistory/3320437/skin/images/dada_ccfolia.css">\n<style>body { background-color: #2b2b2b; color: #fff; padding: 2rem; }</style>\n</head>\n<body>\n${partHtml}\n</body>\n</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `log_${roomId || 'file'}_dada_part${idx + 1}.html`;
    a.click();
  };

  const renderGuideModal = () => (
    <S.ModalOverlay onClick={() => setShowGuide(false)}>
      <S.ModalContent onClick={e => e.stopPropagation()}>
        <S.ModalHeader>
          <h2>📖 사용방법 안내</h2>
          <S.StyledButton secondary onClick={() => setShowGuide(false)} style={{ padding: '0.5rem', width: 'auto' }}><X size={20} /></S.StyledButton>
        </S.ModalHeader>
        <S.ModalBody>
          <S.GuideSection>
            <h3>📦 준비물</h3>
            <ul>
              <li><strong>공식 HTML 로그:</strong> 코코포리아 내 [로그 다운로드] 기능으로 받은 HTML 파일</li>
              <li><strong>JSON 로그:</strong> 외부 페이지나 툴(Log Getter 등)을 통해 추출한 JSON 파일</li>
              <li><small>* HTML 파일 업로드 시 스탠딩 이미지는 수동으로 주소를 입력해주셔야 합니다.</small></li>
            </ul>
          </S.GuideSection>

          <S.GuideSection>
            <h3>⚙️ 사전 세팅 (티스토리 / 개인 홈페이지 등)</h3>
            <p>백업 로그를 올릴 페이지의 <code>&lt;head&gt;</code> 영역에 아래 코드를 미리 추가해 주세요.</p>
            <S.CodeBlockContainer>
              <S.CodeBlock>
{`<!-- [DADA STYLE] 
아래 내용은 티스토리 [스킨 편집] > [HTML 편집] > [HTML]의 <head></head> 사이에 넣어주는 게 가장 좋습니다!
그냥 복사해 넣으셔도 괜찮지만, 게시글을 수정할 때 삭제되는 이슈가 있어 스킨에 직접 넣는 것을 권장합니다. -->
<!-- ccfolia-dada -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://tistory1.daumcdn.net/tistory/3320437/skin/images/dada_ccfolia.css">

<!-- 기존에 배포한 티스토리 롤20 스타일을 넣은 경우 생략합니다! -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<!-- // 기존에 배포한 티스토리 롤20 스타일을 넣은 경우 생략합니다! -->

<!-- 필수: 테마 변경용 -->
<script>
  function ccfThemeChk() {
    $('.btn-theme.is_light').click(function () { $('.ccfolia_wrap').addClass('is_theme-light'); });
    $('.btn-theme.is_dark').click(function () { $('.ccfolia_wrap').removeClass('is_theme-light'); });
  }
  $(function () { ccfThemeChk(); });
</script>
<!-- // [DADA STYLE] -->`}
              </S.CodeBlock>
              <S.CopyCodeButton onClick={() => {
                const codeToCopy = `<!-- [DADA STYLE] \n아래 내용은 티스토리 [스킨 편집] > [HTML 편집] > [HTML]의 <head></head> 사이에 넣어주는 게 가장 좋습니다!\n그냥 복사해 넣으셔도 괜찮지만, 게시글을 수정할 때 삭제되는 이슈가 있어 스킨에 직접 넣는 것을 권장합니다. -->\n<!-- ccfolia-dada -->\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@400;500;700&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="https://tistory1.daumcdn.net/tistory/3320437/skin/images/dada_ccfolia.css">\n\n<!-- 기존에 배포한 티스토리 롤20 스타일을 넣은 경우 생략합니다! -->\n<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>\n<!-- // 기존에 배포한 티스토리 롤20 스타일을 넣은 경우 생략합니다! -->\n\n<!-- 필수: 테마 변경용 -->\n<script>\n  function ccfThemeChk() {\n    $('.btn-theme.is_light').click(function () { $('.ccfolia_wrap').addClass('is_theme-light'); });\n    $('.btn-theme.is_dark').click(function () { $('.ccfolia_wrap').removeClass('is_theme-light'); });\n  }\n  $(function () { ccfThemeChk(); });\n</script>\n<!-- // [DADA STYLE] -->`;
                navigator.clipboard.writeText(codeToCopy);
                alert('코드가 클립보드에 복사되었습니다.');
              }}>
                <ClipboardCheck size={16} /> 코드 복사
              </S.CopyCodeButton>
            </S.CodeBlockContainer>
          </S.GuideSection>

          <S.GuideSection>
            <h3>🚀 사용 안내</h3>
            <ol>
              <li>사이트 내 순서에 맞춰 로그를 불러오거나 파일을 업로드합니다.</li>
              <li>세션 이름과 캐릭터 설정을 마친 후 결과물을 완성합니다.</li>
              <li>변환된 HTML 파일을 다운로드하거나 내용을 복사합니다.</li>
              <li>티스토리 블로그 혹은 개인 홈페이지에 <strong>[HTML 모드]</strong>로 내용을 붙여넣거나 HTML 파일을 업로드하여 백업을 완료합니다!</li>
            </ol>
          </S.GuideSection>
        </S.ModalBody>
      </S.ModalContent>
    </S.ModalOverlay>
  );

  const renderSupportModal = () => (
    <S.ModalOverlay onClick={() => setShowSupport(false)}>
      <S.ModalContent onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <S.ModalHeader>
          <h2>💖 창작자 후원하기</h2>
          <S.StyledButton secondary onClick={() => setShowSupport(false)} style={{ padding: '0.5rem', width: 'auto' }}><X size={20} /></S.StyledButton>
        </S.ModalHeader>
        <S.ModalBody style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>유용하게 사용하고 계신가요?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
            앞으로도 편의를 위한 툴을 개발할 예정입니다💦<br />
            지속적인 개발과 작업자의 당 충전을 위해<br />음료 한 잔 사주시면 큰 힘이 됩니다! 💖
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {SUPPORT_LINKS.paypal && (
              <a href={SUPPORT_LINKS.paypal} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <S.StyledButton primary style={{ width: '100%', padding: '1rem' }}>
                  💳 페이팔(PayPal)로 후원
                </S.StyledButton>
              </a>
            )}
            {SUPPORT_LINKS.kakaopay && (
              <a href={SUPPORT_LINKS.kakaopay} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <S.StyledButton primary style={{ width: '100%', padding: '1rem', background: '#FEE500', color: '#000' }}>
                  💬 카카오톡 오픈채팅 송금
                </S.StyledButton>
              </a>
            )}
            {SUPPORT_LINKS.postype && (
              <a href={SUPPORT_LINKS.postype} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <S.PostypeButton style={{ width: '100%', padding: '1rem' }}>
                  📓 포스타입 후원(구매)
                </S.PostypeButton>
              </a>
            )}
            {!SUPPORT_LINKS.paypal && !SUPPORT_LINKS.kakaopay && !SUPPORT_LINKS.postype && (
              <p style={{ color: 'var(--text-secondary)' }}>아직 후원 링크가 등록되지 않았습니다.</p>
            )}
          </div>
        </S.ModalBody>
      </S.ModalContent>
    </S.ModalOverlay>
  );

  return (
    <S.ConverterContainer>
      <S.Header>
        <h1>DaDa CCFolia Backup</h1>
        <p>코코포리아 로그를 예쁘게 백업해봅시다💦</p>
        <p style={{ marginTop: '.5rem', marginBottom: '.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
          ※ 이 페이지는 600px 이하의 기기 및 반응형 브라우저 환경을 고려하지 않았습니다. PC 환경에서의 사용을 권장합니다.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <S.GuideButton onClick={() => setShowGuide(true)}>
            <HelpCircle size={18} /> 사용방법 안내
          </S.GuideButton>
        </div>
      </S.Header>

      {showGuide && renderGuideModal()}
      {showSupport && renderSupportModal()}

      <S.FloatingSupportButton onClick={() => setShowSupport(true)}>
        <Heart size={20} /> 후원하기
      </S.FloatingSupportButton>

      <S.StepIndicator>
        <S.Step active={step >= 1}>1. 로그 불러오기</S.Step>
        <S.Step active={step >= 2}>2. 설정 & 인물 지정</S.Step>
        <S.Step active={step >= 3}>3. 결과물 완성</S.Step>
      </S.StepIndicator>

      {step === 1 && (
        <S.Panel>
          {isLocal && (
            <>
              <S.FormGroup>
                <label>방 번호(Room ID)로 불러오기</label>
                <S.InputRow>
                  <input 
                    type="text" 
                    placeholder="6h8pKIY5X" 
                    value={roomId} 
                    onChange={e => setRoomId(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && callFetchRoom()}
                  />
                  <S.StyledButton onClick={callFetchRoom} disabled={loading || !roomId}>
                    {loading ? <RefreshCw className="loading-spinner" size={20} style={{ animation: 'spin 1.5s linear infinite' }} /> : <Download size={20} />}
                    가져오기
                  </S.StyledButton>
                </S.InputRow>
                {error && !uploadedFileName && <span style={{color: 'var(--error-color)', fontSize: '0.9rem', marginTop: '0.5rem', display: 'block'}}>{error}</span>}
              </S.FormGroup>

              <div style={{ textAlign: 'center', margin: '2rem 0', color: 'var(--text-secondary)' }}>
                또는
              </div>
            </>
          )}

          <S.FormGroup>
            <label>JSON 또는 HTML 파일 직접 업로드</label>
            <input 
              type="file" 
              accept=".json,.html" 
              style={{ display: 'none' }} 
              ref={fileInputRef} 
              onChange={handleChangeFileUpload} 
              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
            />
            <S.StyledButton secondary onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: '1.2rem' }}>
              <Upload size={20} />
              {uploadedFileName ? `선택됨: ${uploadedFileName}` : '로그 JSON/HTML 파일 선택'}
            </S.StyledButton>
            {error && uploadedFileName && <span style={{color: 'var(--error-color)', fontSize: '0.9rem', marginTop: '0.5rem', display: 'block'}}>{error}</span>}
          </S.FormGroup>

          {fetchSuccess && (
            <div style={{marginTop: '2rem', padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--success-color)', borderRadius: '12px', animation: 'fadeIn 0.3s ease'}}>
              <div style={{color: 'var(--success-color)', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <CheckCircle2 size={20} />
                {uploadedFileName ? '파일 업로드 완료!' : '로그 불러오기 완료!'} ({messages.length}개의 메시지)
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {isDownloaded && !uploadedFileName 
                  ? '원본 파일을 다운로드하셨습니다. 수정한 파일을 아래의 "JSON 파일 직접 업로드"를 통해 다시 업로드해야 진행할 수 있습니다.' 
                  : isLocal 
                    ? '정상적으로 데이터가 준비되었습니다. 다음 단계로 넘어가거나 현재 상태의 JSON 로그를 저장할 수 있습니다.'
                    : '정상적으로 데이터가 준비되었습니다. 다음 단계로 진행해 주세요.'}
              </p>
              <div style={{display: 'flex', gap: '0.75rem', flexWrap: 'wrap'}}>
                <S.StyledButton onClick={() => setStep(2)} disabled={isDownloaded && !uploadedFileName}>다음 단계로 진행 <CheckCircle2 size={18} /></S.StyledButton>
                {isLocal && (
                  <S.StyledButton secondary onClick={handleClickDownloadJson}>
                    <Download size={18}/> {uploadedFileName ? '현재 JSON 다운로드' : '원본 JSON 다운로드'}
                  </S.StyledButton>
                )}
              </div>
            </div>
          )}
        </S.Panel>
      )}

      {step === 2 && (
        <S.Panel style={{ animation: 'fadeInDown 0.5s ease forwards' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <SettingsIcon size={24} color="var(--accent-color)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>기본 설정</h2>
          </div>
          
          <S.FormGroup>
            <label>세션 타이틀</label>
            <input 
              type="text" 
              value={settings.sessionTitle} 
              onChange={e => setSettings({...settings, sessionTitle: e.target.value})} 
            />
          </S.FormGroup>

          <S.FormGroup style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                 type="checkbox" 
                 checked={settings.hideOtherTab} 
                 onChange={e => setSettings({...settings, hideOtherTab: e.target.checked})} 
                 style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
              />
              [Other] 탭 (잡담) 로그 제외하기
            </label>
          </S.FormGroup>

          <S.FormGroup style={{ marginBottom: '2.5rem' }}>
            <label>분할 출력 기준 (메시지 개수)</label>
            <input 
              type="number" 
              value={settings.chunkSize} 
              onChange={e => setSettings({...settings, chunkSize: parseInt(e.target.value, 10)})} 
              min="100"
              step="500"
              style={{ width: '150px' }}
            />
            <p>
              이 개수마다 HTML 출력 결과물이 여러 파트로 나뉩니다. 값이 클수록 하나의 파트에 들어가는 분량이 많아집니다. (기본값: 40000)
            </p>
          </S.FormGroup>

          <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>탭 스타일 (배경색) 지정</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            사용자가 지정한 탭(채널)에 투명한 전용 배경색을 지정할 수 있습니다. CSS 서식을 추가로 적을 수도 있습니다.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '2.5rem' }}>
            {settings.tabStyles.map((tStyle, idx) => (
              <S.TabStyleRow key={idx}>
                <div style={{ width: '130px', flexShrink: 0 }}>
                  <input type="text" placeholder="탭 이름 (예: info)" value={tStyle.tab} onChange={e => handleChangeTabStyle(idx, 'tab', e.target.value)} />
                </div>
                
                <S.ColorBox 
                  color={tStyle.color} 
                  onClick={() => setActivePickerIndex(activePickerIndex === idx ? null : idx)} 
                />

                {activePickerIndex === idx && (
                  <>
                    <S.ColorPickerCover onClick={() => setActivePickerIndex(null)} />
                    <S.ColorPickerPopover>
                      <SketchPicker 
                        color={tStyle.color}
                        onChange={(color) => handleChangeTabStyle(idx, 'color', color.hex)}
                        disableAlpha={true}
                        styles={{
                          default: {
                            picker: {
                              background: '#1e1e20',
                              color: '#fff',
                              borderRadius: '12px',
                              border: '1px solid #333'
                            }
                          }
                        }}
                      />
                    </S.ColorPickerPopover>
                  </>
                )}

                <div style={{ flex: 1 }}>
                  <input type="text" placeholder="추가 스타일 (예: padding-left: 8px;)" value={tStyle.customStyle || ''} onChange={e => handleChangeTabStyle(idx, 'customStyle', e.target.value)} />
                </div>
                <S.StyledButton secondary style={{ padding: '0 1.2rem', height: '48px', borderRadius: '10px' }} onClick={() => handleClickRemoveTabStyle(idx)}>삭제</S.StyledButton>
              </S.TabStyleRow>
            ))}
            <S.StyledButton secondary style={{ width: 'fit-content', padding: '0.6rem 1.2rem', fontSize: '0.9rem', marginTop: '0.5rem' }} onClick={handleClickAddTabStyle}>+ 탭 스타일 추가</S.StyledButton>
          </div>

          <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>인물 유형 지정</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            다다 스킨 양식에 맞춰 인물별 출력 형태를 지정합니다. 플레이어 시 스탠딩(이미지)가 함께 출력됩니다.
          </p>

          <S.CharacterList>
            {characters
              .filter(char => {
                const isOnlyOther = settings.hideOtherTab && char.channels && char.channels.length === 1 && char.channels[0] === 'other';
                return !isOnlyOther;
              })
              .map((char, index) => (
              <S.CharacterCard key={index}>
                {char.imageUrl ? (
                  <img src={char.imageUrl} alt={char.name} className="char-img" />
                ) : (
                  <div className="char-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    👤
                  </div>
                )}
                
                <div className="char-info">
                  <div className="char-name" title={char.name}>
                    {char.name}
                  </div>
                  <select value={char.type} onChange={(e) => {
                    const actualCharIdx = characters.findIndex(c => c.name === char.name);
                    handleChangeCharType(actualCharIdx, e.target.value);
                  }}>
                    <option value="player">플레이어 (스탠딩 포함)</option>
                    <option value="npc">NPC (이름 + 대사만)</option>
                    <option value="desc">일반 지문 (desc - 중앙정렬)</option>
                    <option value="desc2">일반 지문2 (desc2 - 양쪽정렬)</option>
                    <option value="desc3">일반 지문3 (desc3 - 양쪽+이름)</option>
                    <option value="chap">챕터명 (chap)</option>
                    <option value="subChap">부제목 (subChap)</option>
                    <option value="hl">강조 (hl)</option>
                    <option value="hl2">강조2 (hl2)</option>
                    <option value="exclude">출력 안 함 (제외)</option>
                  </select>
                  {isHtmlMode && (
                    <input 
                      type="text" 
                      placeholder="스탠딩 이미지 URL (선택)" 
                      value={char.customImgUrl || ''} 
                      onChange={e => setCharacters(characters.map(c => c.name === char.name ? { ...c, customImgUrl: e.target.value } : c))} 
                    />
                  )}
                </div>
              </S.CharacterCard>
            ))}
          </S.CharacterList>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem', gap: '1rem' }}>
            <S.StyledButton secondary onClick={() => setStep(1)}>뒤로 가기</S.StyledButton>
            <S.StyledButton onClick={handleClickGenerate}>변환하기 <CheckCircle2 size={18} /></S.StyledButton>
          </div>
        </S.Panel>
      )}

      {step === 3 && (
        <S.Panel style={{ animation: 'fadeInDown 0.5s ease forwards' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            변환 완료 <CheckCircle2 size={24} color="var(--success-color)" />
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            티스토리 본문 용량 초과와 화면 렉 발생을 막기 위해 <b>{settings.chunkSize || 40000}개 메시지 단위로 분할(Part)</b> 되었습니다.<br/>
            각 파트를 순서대로 복사하여 티스토리 <b>[HTML 모드]</b>에 이어서 붙여넣거나, 각기 다른 글로 나누어 등록해 주세요.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {outputParts.map((partHtml, idx) => (
              <S.ResultCard key={idx} active={activePart === idx}>
                <div 
                  className="part-header"
                  onClick={() => setActivePart(activePart === idx ? -1 : idx)}
                >
                  <strong>Part {idx + 1}</strong>
                  <span className="arrow">▼</span>
                </div>
                
                {activePart === idx && (
                  <div className="part-body">
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                      <S.StyledButton 
                        onClick={() => handleClickCopyPart(idx, partHtml)} 
                        style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 5, padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: copiedPart === idx ? 'var(--success-color)' : 'rgba(255, 255, 255, 0.1)' }}
                      >
                        {copiedPart === idx ? '복사됨!' : <><Copy size={16} /> 파트 {idx + 1} 복사</>}
                      </S.StyledButton>
                      <S.ResultTextarea value={partHtml} readOnly />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                       <S.StyledButton secondary onClick={() => handleClickDownloadPart(idx, partHtml)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                         <Download size={16} /> 파트 {idx + 1} 파일 다운로드
                       </S.StyledButton>
                    </div>
                  </div>
                )}
              </S.ResultCard>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1rem' }}>
            <S.StyledButton secondary onClick={() => setStep(2)}>이전 단계 (설정 수정)</S.StyledButton>
          </div>
        </S.Panel>
      )}
    </S.ConverterContainer>
  );
}

export default Converter;
