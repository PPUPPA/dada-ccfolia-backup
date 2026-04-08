import { ICCFoliaMessage, ICharacter, ISettings } from '../interfaces';

export function getExtractedCharacters(messages: ICCFoliaMessage[]): ICharacter[] {
  const charMap = new Map<string, {
    name: string;
    imageUrl: string;
    type: string;
    channels: Set<string>;
  }>();

  messages.forEach((msg: any) => {
    // Firestore 형식과 플랫 형식을 모두 체크
    const fields = msg.fields;
    const name = fields?.name?.stringValue || msg.name;
    if (!name) return;

    const imageUrl = fields?.imageUrl?.stringValue || fields?.iconUrl?.stringValue || msg.imageUrl || msg.iconUrl || '';
    const channel = fields?.channel?.stringValue || msg.channel || '';

    if (!charMap.has(name)) {
      let defaultType = 'player';
      const upperName = name.toUpperCase();
      if (upperName === 'GM') defaultType = 'desc';
      else if (upperName === 'SYSTEM') defaultType = 'desc2';
      else if (upperName === 'CH') defaultType = 'chap';
      else if (upperName === 'HL') defaultType = 'subChap';
      else if (upperName === 'HH') defaultType = 'hl';

      charMap.set(name, {
        name,
        imageUrl,
        type: defaultType,
        channels: new Set([channel]),
      });
    } else {
      const charObj = charMap.get(name)!;
      if (!charObj.imageUrl && imageUrl) charObj.imageUrl = imageUrl;
      if (channel) charObj.channels.add(channel);
    }
  });

  return Array.from(charMap.values()).map(c => ({
    ...c,
    channels: Array.from(c.channels)
  }));
}

export function generateDadaHTMLParts(messages: ICCFoliaMessage[], settings: ISettings, characters: ICharacter[], chunkSize: number = 500): string[] {
  const sortedMessages = [...messages].sort((a, b) => {
    const timeA = new Date(a.fields?.createdAt?.timestampValue || a.createTime || 0).getTime();
    const timeB = new Date(b.fields?.createdAt?.timestampValue || b.createTime || 0).getTime();
    return timeA - timeB;
  });

  const charTypeMap: Record<string, string> = {};
  characters.forEach(c => { charTypeMap[c.name] = c.type; });

  const validMessages = sortedMessages.filter((msg: any) => {
    const fields = msg.fields;
    const text = fields?.text?.stringValue || msg.text;
    if (!text) return false;

    const channel = fields?.channel?.stringValue || msg.channel || '';
    const name = fields?.name?.stringValue || msg.name || '';
    
    if (settings.hideOtherTab && channel === 'other') return false;
    const type = charTypeMap[name] || 'exclude';
    if (type === 'exclude') return false;
    return true;
  });

  const parts: string[] = [];
  const RET = '\n';

  if (validMessages.length === 0) {
    return [`<div class="ccfolia_wrap has_theme${settings.defaultTheme === 'light' ? ' is_theme-light' : ''}">\n  <h1 class="session-title">${settings.sessionTitle}</h1>\n  <div class="tab">\n    <p style="padding: 2rem; color: #fff;">출력할 로그가 없습니다.</p>\n  </div>\n</div>\n`];
  }

  for (let i = 0; i < validMessages.length; i += chunkSize) {
    const chunkMsgs = validMessages.slice(i, i + chunkSize);
    
    let html = `<div class="ccfolia_wrap has_theme${settings.defaultTheme === 'light' ? ' is_theme-light' : ''}">\n`;
    html += `  <h1 class="session-title">${settings.sessionTitle}</h1>\n`;
    html += `  <div class="tab">\n`;

    let previousTab: string | null = null;
    let previousName: string | null = null;
    let previousImgUrl: string | null = null;
    let isMergedBlock = false;

    const closeMergedBlockIfNeeded = () => {
      let result = '';
      if (isMergedBlock) {
        result += `</span></span></p>\n\n`;
        isMergedBlock = false;
      }
      return result;
    };

    chunkMsgs.forEach((msg: any) => {
      const fields = msg.fields;
      const text = fields?.text?.stringValue || msg.text || '';
      const name = fields?.name?.stringValue || msg.name || '';
      const channel = fields?.channel?.stringValue || msg.channel || '';
      const color = fields?.color?.stringValue || msg.color || '#888888';
      const type = charTypeMap[name] || 'exclude';

      let rollVal = '';
      try {
        const rollResult = fields?.extend?.mapValue?.fields?.roll?.mapValue?.fields?.result?.stringValue || msg.rollResult;
        if (rollResult) {
          rollVal = rollResult.split(/\r?\n/).join('');
          rollVal = '<br>' + RET + '    ' + rollVal;
        }
      } catch(e) {
        console.error(e);
      }

      let contentText = text.split(/\r?\n/).join('<br>' + RET + '    ') + rollVal;
      
      const isPlayerOrNpc = type === 'player' || type === 'npc';
      const isDice = isPlayerOrNpc && (/[0-9]+[DdXx]+[0-9]|sc[0-9]/.test(contentText) || contentText.includes('シークレットダイ스'));
      const isChoice = isPlayerOrNpc && contentText.includes('choice') && contentText.includes('＞');
      const iconDice = isChoice ? '🎰' : (isDice ? '🎲' : '');
      const diceClass = (isDice || isChoice) ? ' dice_roll' : '';
      
      let iconHTML = iconDice ? `<i class="ico-dice">${iconDice}</i>` : '';
      let innerText = isDice && contentText.includes('シークレットダイ스') ? 'Secret dice' : contentText.split('#').join('<br>#');
      
      let textContentHTML = `<span class="text${diceClass}">${iconHTML}${innerText}</span>`;
      let plainContentHTML = `<span>${iconHTML}${innerText}</span>`;

      const plIndex = characters.findIndex(c => c.name === name);
      const customImgUrl = plIndex >= 0 ? characters[plIndex].customImgUrl : '';
      const messageImgUrl = fields?.imageUrl?.stringValue || fields?.iconUrl?.stringValue || msg.imageUrl || msg.iconUrl || '';
      const imgUrl = customImgUrl || messageImgUrl;

      if (type === 'player' || type === 'npc') {
        if (previousName === name && previousTab === channel && previousImgUrl === imgUrl) {
          html += `${textContentHTML}`;
        } else {
          html += closeMergedBlockIfNeeded();
          
          let pClass = 'is_player';
          pClass += ` pl${plIndex >= 0 ? plIndex : 0}`;

          let inlineStyleStr = '';
          if (color !== '#888888') inlineStyleStr += `color:${color};`;
          const customTab = settings.tabStyles?.find(t => t.tab === channel);
          if (customTab) { 
             if (customTab.color) {
               inlineStyleStr += ` background-color: ${customTab.color}14;`;
             }
             if (customTab.customStyle) {
               inlineStyleStr += ` ${customTab.customStyle.trim()}`;
             }
          }
          let inlineStyleAttr = inlineStyleStr ? ` style="${inlineStyleStr.trim()}"` : '';

          html += `  <p class="${pClass}" data-tab="${channel}"${inlineStyleAttr}><span class="player_info">`;
          if (imgUrl && type !== 'npc') {
            html += `<span class="pl_img_wrap"><img class="pl_img" src="${imgUrl}" alt="character image"></span>`;
          }
          html += `</span><span class="pl_chat"><strong class="pl_name">${name}</strong><span class="text_wrap">${textContentHTML}`;
          
          isMergedBlock = true;
        }
      } else {
        html += closeMergedBlockIfNeeded();
        
        let pClass = '';
        let hideName = true;
        let nameOutput = `<span class="ir_text">${name}</span>`;

        switch (type) {
          case 'desc': pClass = 'is_desc'; break;
          case 'desc2': pClass = 'is_desc is_align-left'; break;
          case 'desc3': pClass = 'is_desc is_align-left'; hideName = false; break;
          case 'chap': pClass = 'is_chapter'; break;
          case 'subChap': pClass = 'is_sub-chapter'; break;
          case 'hl': pClass = 'is_highlight'; break;
          case 'hl2': pClass = 'is_highlight is_align-left'; break;
          default: pClass = 'is_desc'; break;
        }

        if (!hideName) {
          nameOutput = `<span class="pl_name">${name}</span> : `;
        }

        let inlineStyleStr = '';
        if (name.toUpperCase() === 'SYSTEM') inlineStyleStr += 'color: #888888;';
        const customTab = settings.tabStyles?.find(t => t.tab === channel);
        if (customTab) { 
           if (customTab.color) {
             inlineStyleStr += ` background-color: ${customTab.color}14;`;
           }
           if (customTab.customStyle) {
             inlineStyleStr += ` ${customTab.customStyle.trim()}`;
           }
        }
        let inlineStyleAttr = inlineStyleStr ? ` style="${inlineStyleStr.trim()}"` : '';

        html += `  <p class="${pClass}" data-tab="${channel}"${inlineStyleAttr}>\n`;
        html += `    ${nameOutput}\n`;
        html += `    ${plainContentHTML}\n`;
        html += `  </p>\n\n`;
      }

      previousName = name;
      previousTab = channel;
      previousImgUrl = imgUrl;
    });

    html += closeMergedBlockIfNeeded();

    html += `  </div>\n`;
    html += `  <div class="btn_wrap btn_wrap-theme">\n`;
    html += `    <button type="button" class="btn btn-theme is_light"><span class="ir_text">라이트 모드</span></button>\n`;
    html += `    <button type="button" class="btn btn-theme is_dark"><span class="ir_text">다크 모드</span></button>\n`;
    html += `  </div>\n`;
    html += `</div>\n`;

    parts.push(html);
  }

  return parts;
}
