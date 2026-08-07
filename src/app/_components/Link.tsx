export default function Link({ link, replace }: { link: string; replace: string }) {
    return (
      <a href={link} target="_blank" className="text-forest underline text-[16px]">
        {replace}
      </a>
    );
  }
  