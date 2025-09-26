const {
  AttachmentBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  MentionableSelectMenuBuilder,
  ChannelSelectMenuBuilder
} = require('discord.js');

const parseNumeric = (value, label) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(`${label} must be a finite number.`);
    }
    return parsed;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`${label} must be a finite number.`);
    }
    return value;
  }

  throw new Error(`${label} must be a number or numeric string.`);
};

const resolveAttachment = (attachment) => {
  if (typeof attachment === 'string') {
    return new AttachmentBuilder(attachment);
  }

  if (attachment && typeof attachment === 'object') {
    const {
      buffer,
      data,
      attachment: file,
      name,
      description,
      spoiler,
      duration,
      durationSeconds,
      durationSecs,
      durationMs,
      durationMillis
    } = attachment;

    const resource = buffer ?? data ?? file;
    if (!resource) {
      throw new Error('Attachment objects must include a Buffer/Uint8Array in `buffer`, `data`, or `attachment`.');
    }

    const options = {};
    if (name) {
      options.name = name;
    }
    if (typeof description === 'string') {
      options.description = description;
    }
    const builder = new AttachmentBuilder(resource, options);

    if (spoiler === true) {
      if (!builder.name) {
        builder.setName('attachment');
      }
      builder.setSpoiler(true);
    }

    const durationValue = durationSeconds ?? durationSecs ?? duration;
    const durationMsValue = durationMs ?? durationMillis;
    if (durationMsValue !== undefined && durationValue !== undefined) {
      throw new Error('Specify attachment duration in either seconds or milliseconds, not both.');
    }

    if (durationMsValue !== undefined) {
      const ms = parseNumeric(durationMsValue, 'Attachment duration (ms)');
      if (ms < 0) {
        throw new Error('Attachment duration cannot be negative.');
      }
      builder.duration_secs = ms / 1000;
    } else if (durationValue !== undefined) {
      const seconds = parseNumeric(durationValue, 'Attachment duration');
      if (seconds < 0) {
        throw new Error('Attachment duration cannot be negative.');
      }
      builder.duration_secs = seconds;
    }

    return builder;
  }

  throw new Error("msg.attachments contains an unsupported value; expected string or object with 'buffer', 'data', or 'attachment'.");
};

const formatAttachments = (inputAttachments) => {
  if (!inputAttachments) {
    return [];
  }

  if (Array.isArray(inputAttachments)) {
    return inputAttachments.map(resolveAttachment);
  }

  return [resolveAttachment(inputAttachments)];
};

const formatEmbeds = (inputEmbeds) => {
  if (!inputEmbeds) {
    return [];
  }

  if (Array.isArray(inputEmbeds)) {
    return [...inputEmbeds];
  }

  if (typeof inputEmbeds === 'object') {
    return [inputEmbeds];
  }

  throw new Error("msg.embeds isn't an object or array");
};

const formatComponents = (inputComponents) => {
  if (!inputComponents) {
    return [];
  }

  if (!Array.isArray(inputComponents)) {
    throw new Error("msg.components must be an array of action rows");
  }

  return inputComponents.reduce((rows, component) => {
    if (component?.type !== 1 || !Array.isArray(component.components)) {
      throw new Error('Component rows must have type 1 and include a components array.');
    }

    const actionRow = new ActionRowBuilder();
    component.components.forEach((subComponentData) => {
      switch (subComponentData?.type) {
        case 2:
          actionRow.addComponents(new ButtonBuilder(subComponentData));
          break;
        case 3:
          actionRow.addComponents(new StringSelectMenuBuilder(subComponentData));
          break;
        case 5:
          actionRow.addComponents(new UserSelectMenuBuilder(subComponentData));
          break;
        case 6:
          actionRow.addComponents(new RoleSelectMenuBuilder(subComponentData));
          break;
        case 7:
          actionRow.addComponents(new MentionableSelectMenuBuilder(subComponentData));
          break;
        case 8:
          actionRow.addComponents(new ChannelSelectMenuBuilder(subComponentData));
          break;
        default:
          throw new Error(`Unsupported component type '${subComponentData?.type}'.`);
      }
    });

    rows.push(actionRow);
    return rows;
  }, []);
};

module.exports = {
  formatComponents,
  formatAttachments,
  formatEmbeds
};
