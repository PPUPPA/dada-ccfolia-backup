export interface ICCFoliaMessage {
  fields: {
    name: { stringValue: string };
    text: { stringValue: string };
    channel: { stringValue: string };
    color?: { stringValue: string };
    imageUrl?: { stringValue: string };
    iconUrl?: { stringValue: string };
    createdAt?: { timestampValue: string; stringValue: string };
    extend?: {
      mapValue: {
        fields: {
          roll?: {
            mapValue: {
              fields: {
                result?: { stringValue: string };
              };
            };
          };
        };
      };
    };
  };
  createTime?: string;
}

export interface ICharacter {
  name: string;
  imageUrl: string;
  type: string;
  channels: string[];
  customImgUrl?: string;
}

export interface ITabStyle {
  tab: string;
  color: string;
  customStyle?: string;
}

export interface ISettings {
  sessionTitle: string;
  hideOtherTab: boolean;
  chunkSize: number;
  tabStyles: ITabStyle[];
}
