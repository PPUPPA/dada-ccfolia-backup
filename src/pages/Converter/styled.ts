import styled from 'styled-components';

export const ConverterContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 4rem 1.5rem;
  min-height: 100vh;
  animation: fadeIn 0.8s ease;
`;

export const Header = styled.div`
  text-align: center;
  margin-bottom: 3.5rem;

  h1 {
    font-size: 3rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.025em;
  }

  p {
    color: var(--text-secondary);
    font-size: 1.1rem;
  }
`;

export const GuideButton = styled.button`
  background: var(--accent-color);
  color: #fff;
  border: none;
  margin-top: 1.2rem;
  padding: 0.6rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);

  &:hover {
    background: var(--accent-hover);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  }
`;

export const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

export const Step = styled.div<{ active: boolean }>`
  padding: 0.6rem 1.2rem;
  border-radius: 30px;
  font-size: 0.95rem;
  font-weight: 600;
  background: ${props => props.active ? 'rgba(99, 102, 241, 0.1)' : 'transparent'};
  color: ${props => props.active ? 'var(--accent-color)' : 'var(--text-secondary)'};
  border: 1px solid ${props => props.active ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-color)'};
  transition: all 0.3s ease;
`;

export const Panel = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`;

export const FormGroup = styled.div`
  margin-bottom: 2rem;

  label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  input[type="text"],
  input[type="number"],
  textarea,
  select {
    width: 100%;
    padding: 0.85rem 1rem;
    background: var(--bg-primary) !important;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    color: var(--text-primary);
    font-size: 1rem;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &::placeholder {
      color: #555;
    }
  }

  p {
    color: var(--text-secondary);
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
`;

export const InputRow = styled.div`
  display: flex;
  gap: 0.75rem;

  input {
    flex: 1;
  }
`;

export const TabStyleRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
  position: relative;

  input[type="text"] {
    width: 100%;
    box-sizing: border-box;
    background: var(--bg-primary) !important;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 0.85rem 1rem;
    color: #fff;
    font-size: 1rem;
    
    &:focus {
      border-color: var(--accent-color);
      outline: none;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
  }
`;

export const ColorBox = styled.div<{ color: string }>`
  width: 70px;
  height: 48px;
  background-color: ${props => props.color};
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.1s ease;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.05);
  }
`;

export const ColorPickerPopover = styled.div`
  position: absolute;
  z-index: 100;
  top: 55px;
  left: 158px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  border-radius: 12px;
  overflow: hidden;
`;

export const ColorPickerCover = styled.div`
  position: fixed;
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
  z-index: 99;
`;

export const StyledButton = styled.button<{ primary?: boolean; secondary?: boolean }>`
  background: ${props => props.primary ? 'var(--accent-color)' : props.secondary ? 'rgba(255, 255, 255, 0.05)' : 'var(--accent-color)'};
  color: #fff;
  border: 1px solid ${props => props.primary ? 'transparent' : props.secondary ? 'var(--border-color)' : 'transparent'};
  padding: 0.85rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.primary ? 'var(--accent-hover)' : props.secondary ? 'rgba(255, 255, 255, 0.1)' : 'var(--accent-hover)'};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
`;

export const ModalContent = styled.div`
  background: #1e1e20;
  width: 90%;
  max-width: 650px;
  max-height: 85vh;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
`;

export const ModalHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: 1.4rem;
    font-weight: 700;
  }
`;

export const ModalBody = styled.div`
  padding: 2rem;
  overflow-y: auto;
`;

export const GuideSection = styled.section`
  margin-bottom: 2rem;

  h3 {
    font-size: 1.1rem;
    margin-bottom: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  ul, ol {
    padding-left: 1.5rem;
    color: var(--text-secondary);
    
    li {
      margin-bottom: 0.5rem;
    }
  }

  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.9em;
  }
`;

export const CodeBlockContainer = styled.div`
  position: relative;
  margin-top: 1rem;
`;

export const CodeBlock = styled.pre`
  background: #0d1117;
  color: #c9d1d9;
  padding: 1.5rem;
  border-radius: 12px;
  font-size: 0.85rem;
  line-height: 1.6;
  overflow-x: auto;
  border: 1px solid var(--border-color);
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3);
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;

  &::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
`;

export const ResultTextarea = styled.textarea`
  width: 100%;
  height: 250px !important;
  background: #0d1117 !important;
  color: #c9d1d9 !important;
  padding: 1.5rem !important;
  border-radius: 12px !important;
  font-size: 0.85rem !important;
  line-height: 1.6 !important;
  border: 1px solid var(--border-color) !important;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3) !important;
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace !important;
  resize: none;

  &::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
`;

export const CopyCodeButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const ResultCard = styled.div<{ active: boolean }>`
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-secondary);
  margin-bottom: 1rem;

  .part-header {
    padding: 1rem;
    background: ${props => props.active ? 'rgba(255,255,255,0.05)' : 'transparent'};
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;

    strong {
      font-size: 1.1rem;
    }

    .arrow {
      transition: transform 0.2s;
      transform: ${props => props.active ? 'rotate(180deg)' : 'none'};
    }
  }

  .part-body {
    padding: 1rem;
    border-top: 1px solid var(--border-color);
    animation: fadeIn 0.2s ease forwards;
  }
`;

export const CharacterList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.2rem;
  margin-top: 1.5rem;
`;

export const CharacterCard = styled.div`
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  padding: 1.25rem;
  border-radius: 12px;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--accent-color);
  }

  .char-img {
    width: 60px;
    height: 60px;
    border-radius: 10px;
    object-fit: cover;
    background: rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
  }

  .char-info {
    flex: 1;
    min-width: 0;

    .char-name {
      font-weight: 700;
      margin-bottom: 0.5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    select,
    input[type="text"] {
      width: 100%;
      padding: 0.5rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: var(--accent-color);
      }
    }
    
    input[type="text"] {
      cursor: text;
    }

    select {
      cursor: pointer;
    }
  }
`;
