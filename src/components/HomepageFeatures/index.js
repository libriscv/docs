import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Lowest possible latency',
    Svg: require('@site/static/img/undraw_to_the_stars_re_wq2x.svg').default,
    description: (
      <>
        Calling a guest VM function can finish 1-2 orders of magnitude before other emulators begin executing the first instruction
      </>
    ),
  },
  {
    title: 'Cross-platform support',
    Svg: require('@site/static/img/undraw_real_time_collaboration_c62i.svg').default,
    description: (
      <>
        Compile once your code and run it. The sandbox will be compiled for every platform and interpret your code.
      </>
    ),
  },
  {
    title: 'Secure Sandbox',
    Svg: require('@site/static/img/undraw_safe_re_kiil.svg').default,
    description: (
      <>
        Provides a safe sandbox that guests can not escape from, short of vulnerabilities in custom system calls installed by the host.
      </>
    ),
  },
  {
    title: 'Godot Addon',
    Svg: require('@site/static/img/undraw_video_games_x1tr.svg').default,
    description: (
      <>
        Supports Godot game engine with godot-sandbox addon.
      </>
    ),
  },
  {
    title: 'JIT-compiled languages',
    Svg: require('@site/static/img/undraw_start_building_re_xani.svg').default,
    description: (
      <>
        Supports sandboxing language-runtimes that use JIT-compilation, eg. V8 JavaScript.
      </>
    ),
  },
  {
    title: 'Tiny memory footprint',
    Svg: require('@site/static/img/undraw_server_re_twwj.svg').default,
    description: (
      <>
        Less than 40kB total memory usage for fibonacci program.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>

      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
