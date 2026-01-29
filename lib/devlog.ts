export const log = (msg: string) => {
    process.env.NODE_ENV === 'development' && console.log(`[devlog] ${msg}`);
}